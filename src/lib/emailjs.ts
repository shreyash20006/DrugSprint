import emailjs from 'emailjs-com';

export interface EmailParams {
  to_name: string;
  student_name: string;
  student_year: string;
  question: string;
}

export const sendQuestionEmail = async (params: EmailParams) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn(
      "⚠️ TGPCOP Warning: EmailJS environment variables are missing! " +
      "Logging structured dispatch parameters to console instead for debugging."
    );
    console.log("📨 [EmailJS Mock Sent]:", {
      to_name: params.to_name,
      student_name: params.student_name,
      student_year: params.student_year,
      question: params.question,
      reply_link: `${window.location.origin}/admin`
    });
    return { status: 200, text: "Mock dispatch completed successfully" };
  }

  const templateParams = {
    to_name: params.to_name,
    student_name: params.student_name,
    student_year: params.student_year,
    question: params.question,
    reply_link: `${window.location.origin}/admin`
  };

  return emailjs.send(serviceId, templateId, templateParams, publicKey);
};

export default sendQuestionEmail;
