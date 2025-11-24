import { Resend } from 'resend';

// Use a fallback key to prevent crash on initialization if env var is missing
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export const sendWelcomeEmail = async (email: string, name: string) => {
    // Check if the key is missing or is the fallback key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_123456789') {
        console.warn('RESEND_API_KEY is not set. Skipping email sending.');
        return { success: false, error: 'Missing API Key' };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'Hunter <onboarding@resend.dev>', // Update this with your verified domain later
            to: [email],
            subject: 'Bienvenido a HUNTER',
            html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Bienvenido a HUNTER, ${name}!</h1>
          <p>Estamos emocionados de tenerte a bordo.</p>
          <p>Con HUNTER, podrás encontrar las mejores oportunidades de licitación impulsadas por Inteligencia Artificial.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          <br/>
          <p>El equipo de HUNTER</p>
        </div>
      `,
        });

        if (error) {
            console.error('Error sending welcome email:', error);
            return { success: false, error };
        }

        return { success: true, data };
    } catch (error) {
        console.error('Exception sending welcome email:', error);
        return { success: false, error };
    }
};
