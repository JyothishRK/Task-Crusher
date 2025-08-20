const { Resend } = require('resend');

let resend = null;

if (!process.env.RESEND_API_KEY) {
    console.error('Error: RESEND_API_KEY environment variable is not set');
} else {
    resend = new Resend(process.env.RESEND_API_KEY);
}

const sendWelcomeEmail = async (email, name) => {
    const emailData = {
        from: 'Task Crusher <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Task Crusher! 🚀',
        text: `Hi ${name},\n\nWelcome to Task Crusher! We're thrilled to have you on board. Task Crusher is here to help you track your tasks, stay organized, and crush your goals with ease.\n\nGet started by logging in and exploring your dashboard. If you have any questions, feel free to reach out.\n\nHere's to smashing those tasks!\n\nCheers,\nThe Task Crusher Team`,
        html: `
            <p>Hi <strong>${name}</strong>,</p>
            <p>Welcome to <strong>Task Crusher</strong>! We're thrilled to have you on board. Task Crusher is here to help you track your tasks, stay organized, and crush your goals with ease.</p>
            <p>Get started by logging in and exploring your dashboard. If you have any questions, feel free to reach out.</p>
            <p>Here's to smashing those tasks! 🚀</p>
            <p>Cheers,<br>The Task Crusher Team</p>
        `,
    };
    
    try {
        if (!resend) {
            throw new Error('Email service not initialized - RESEND_API_KEY is missing');
        }
        await resend.emails.send(emailData);
        console.log('Welcome email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

const sendAccountDeletionEmail = async (email, name) => {
    const emailData = {
        from: 'Task Crusher <onboarding@resend.dev>',
        to: [email],
        subject: 'Your Task Crusher Account Has Been Deleted',
        text: `Hi ${name},\n\nWe're writing to confirm that your Task Crusher account has been successfully deleted. We're sorry to see you go, but we respect your decision.\n\nIf this was a mistake or you'd like to rejoin in the future, we'd be happy to welcome you back. Your productivity journey is always welcome here!\n\nThank you for giving Task Crusher a try. Wishing you all the best!\n\nCheers,\nThe Task Crusher Team`,
        html: `
            <p>Hi <strong>${name}</strong>,</p>
            <p>We're writing to confirm that your <strong>Task Crusher</strong> account has been successfully deleted. We're sorry to see you go, but we respect your decision.</p>
            <p>If this was a mistake or you'd like to rejoin in the future, we'd be happy to welcome you back. Your productivity journey is always welcome here!</p>
            <p>Thank you for giving Task Crusher a try. Wishing you all the best!</p>
            <p>Cheers,<br>The Task Crusher Team</p>
        `,
    };
    
    try {
        if (!resend) {
            throw new Error('Email service not initialized - RESEND_API_KEY is missing');
        }
        await resend.emails.send(emailData);
        console.log('Account deletion email sent to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};


module.exports = {
    sendWelcomeEmail,
    sendAccountDeletionEmail,
}
