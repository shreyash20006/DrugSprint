export interface CashfreePaymentParams {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  amount: number;
  purpose: string;
  description: string;
  recordId: string; // Used to structure the return URL
}

function loadCashfree(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Cashfree) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function initiatePayment({
  studentName,
  studentEmail,
  studentPhone,
  amount,
  purpose,
  description,
  recordId
}: CashfreePaymentParams): Promise<any> {
  // 1. Load Cashfree JS SDK
  const loaded = await loadCashfree();
  if (!loaded) {
    throw new Error('Cashfree SDK failed to load. Please check your internet connection.');
  }

  const mode = import.meta.env.VITE_CASHFREE_MODE || 'sandbox';

  // 2. Create Order via our secure Vercel Serverless Function
  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      studentName,
      studentEmail,
      studentPhone,
      amount,
      purpose,
      description,
      recordId
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Cashfree Serverless Function Failure:', errorData);
    throw new Error(errorData.error || 'Failed to create secure transaction session.');
  }

  const orderData = await response.json();
  const paymentSessionId = orderData.payment_session_id;
  const orderId = orderData.order_id;

  if (!paymentSessionId) {
    throw new Error('Failed to generate payment session from Cashfree gateway.');
  }

  // 3. Initialize Cashfree and trigger Checkout popup modal
  const cashfree = (window as any).Cashfree({ mode });

  return new Promise((resolve, reject) => {
    cashfree.checkout({
      paymentSessionId: paymentSessionId,
      redirectTarget: '_modal'
    }).then((result: any) => {
      if (result.error) {
        console.warn('Cashfree Checkout Closed/Failed:', result.error);
        reject(new Error(result.error.message || 'Payment session closed or failed.'));
      } else {
        resolve({
          razorpay_payment_id: result.paymentDetails?.cfPaymentId || orderId, // maintain compatibility with existing handlers
          cfOrderId: orderId
        });
      }
    });
  });
}
