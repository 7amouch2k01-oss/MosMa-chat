const nodemailer = require('nodemailer');

/**
 * Sends an email using SMTP if configured, otherwise falls back to logging to the console.
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise<boolean>} Resolves to true if successful or dev fallback was triggered
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
        try {
            const transporter = nodemailer.createTransport({
                host,
                port: parseInt(port),
                secure: parseInt(port) === 465, // true for 465, false for other ports
                auth: {
                    user,
                    pass
                }
            });

            const info = await transporter.sendMail({
                from: `"MosMA Chat" <${user}>`,
                to,
                subject,
                text,
                html: html || text
            });

            console.log(`[EMAIL] Sent successfully: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('[EMAIL ERROR] Failed to send email via SMTP:', error);
            console.log(`[EMAIL FALLBACK] Dev Code logged to console instead.`);
        }
    }

    // Dev mode fallback (or if SMTP fails)
    console.log('\n==================================================');
    console.log(`[DEV EMAIL] Simulation`);
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log('==================================================\n');
    return true;
};

module.exports = sendEmail;
