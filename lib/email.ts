import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY!);
  return resend;
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@alumni.school.edu";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendApprovalEmail(email: string, name: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM, to: email,
      subject: "Your Gangalal ALumni Account is Approved! 🎓",
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h1 style="color:#4f46e5">Welcome to Gangalal ALumni, ${name}!</h1>
        <p>Your account has been verified and approved.</p>
        <a href="${APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:12px 24px;border-radius:50px;text-decoration:none;margin-top:16px;font-weight:bold">Go to Dashboard →</a>
      </div>`,
    });
  } catch (err) { console.error("Failed to send approval email:", err); }
}

export async function sendRejectionEmail(email: string, name: string, reason: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM, to: email,
      subject: "Gangalal ALumni Application Update",
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>Dear ${name},</h2>
        <p>Your account application has not been approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <a href="${APP_URL}/contact" style="display:inline-block;background:#6b7280;color:white;padding:12px 24px;border-radius:50px;text-decoration:none;margin-top:16px">Contact Support</a>
      </div>`,
    });
  } catch (err) { console.error("Failed to send rejection email:", err); }
}

export async function sendAdminNewSignupAlert(adminEmail: string, newUserName: string, newUserEmail: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM, to: adminEmail,
      subject: "New Gangalal ALumni Registration Pending Approval",
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>New Member Registration</h2>
        <p><strong>${newUserName}</strong> (${newUserEmail}) is awaiting approval.</p>
        <a href="${APP_URL}/admin/users?status=pending" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:12px 24px;border-radius:50px;text-decoration:none;margin-top:16px;font-weight:bold">Review in Admin Panel →</a>
      </div>`,
    });
  } catch (err) { console.error("Failed to send admin signup alert:", err); }
}

export async function sendArticleApprovedEmail(email: string, name: string, articleTitle: string, articleSlug: string): Promise<void> {
  try {
    await getResend().emails.send({
      from: FROM, to: email,
      subject: `Your article "${articleTitle}" is now published!`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2>Article Published! 🎉</h2>
        <p>Hi ${name}, your article <strong>"${articleTitle}"</strong> is now live.</p>
        <a href="${APP_URL}/articles/${articleSlug}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:white;padding:12px 24px;border-radius:50px;text-decoration:none;margin-top:16px">View Article →</a>
      </div>`,
    });
  } catch (err) { console.error("Failed to send article approval email:", err); }
}
