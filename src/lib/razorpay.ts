export interface PaymentParams {
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  amount: number;
  purpose: string;
  description: string;
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
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
  description
}: PaymentParams): Promise<any> {
  const loaded = await loadRazorpay();
  if (!loaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amount * 100, // Amount is in currency subunits. Default is paise for INR (100 paise = 1 INR)
      currency: 'INR',
      name: 'TGPCOP Student Council',
      description: description || purpose,
      image: 'https://res.cloudinary.com/dsqxboxoc/image/upload/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg',
      prefill: {
        name: studentName,
        email: studentEmail,
        contact: studentPhone
      },
      theme: {
        color: '#C84B0E'
      },
      handler: function(response: any) {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by student'));
        }
      }
    };
    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  });
}
