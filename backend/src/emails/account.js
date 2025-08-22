const axios = require('axios');

// MailerLite API configuration
const MAILERLITE_API_BASE = 'https://connect.mailerlite.com/api';
let apiKey = null;

// Initialize API key
const initializeEmailService = () => {
    if (!process.env.MAILERLITE_API_KEY) {
        throw new Error('MAILERLITE_API_KEY environment variable is not set');
    }
    apiKey = process.env.MAILERLITE_API_KEY;
    return true;
};

// Helper function to create API headers
const createHeaders = () => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Version': '2024-01-01'
});

// Helper function to check if subscriber exists
const checkSubscriberExists = async (email) => {
    try {
        const response = await axios.get(`${MAILERLITE_API_BASE}/subscribers/${email}`, {
            headers: createHeaders()
        });
        return { exists: true, subscriber: response.data.data };
    } catch (error) {
        if (error.response?.status === 404) {
            return { exists: false, subscriber: null };
        }
        throw error;
    }
};

// Helper function to create or update subscriber
const createOrUpdateSubscriber = async (email, name, status = 'active') => {
    const subscriberData = {
        email: email,
        fields: { name: name },
        status: status
    };

    try {
        const response = await axios.post(`${MAILERLITE_API_BASE}/subscribers`, subscriberData, {
            headers: createHeaders()
        });
        return response.data.data?.id;
    } catch (error) {
        throw new Error(`Failed to create subscriber: ${error.response?.data?.message || error.message}`);
    }
};

// Helper function to update existing subscriber
const updateSubscriber = async (email, updateData) => {
    try {
        const response = await axios.put(`${MAILERLITE_API_BASE}/subscribers/${email}`, updateData, {
            headers: createHeaders()
        });
        return response.data.data;
    } catch (error) {
        throw new Error(`Failed to update subscriber: ${error.response?.data?.message || error.message}`);
    }
};

// Helper function to create temporary group
const createTemporaryGroup = async (groupName) => {
    const groupData = {
        name: groupName,
        type: 'temporary'
    };

    try {
        const response = await axios.post(`${MAILERLITE_API_BASE}/groups`, groupData, {
            headers: createHeaders()
        });
        return response.data.data?.id;
    } catch (error) {
        throw new Error(`Failed to create group: ${error.response?.data?.message || error.message}`);
    }
};

// Helper function to add subscriber to group
const addSubscriberToGroup = async (email, groupId) => {
    try {
        await axios.post(`${MAILERLITE_API_BASE}/subscribers/${email}/groups/${groupId}`, {}, {
            headers: createHeaders()
        });
        return true;
    } catch (error) {
        throw new Error(`Failed to add subscriber to group: ${error.response?.data?.message || error.message}`);
    }
};

// Main welcome email function
const sendWelcomeEmail = async (email, name) => {
    try {
        if (!apiKey) {
            initializeEmailService();
        }

        // Check if subscriber already exists
        const { exists, subscriber } = await checkSubscriberExists(email);
        let subscriberId = subscriber?.id;

        // Create or update subscriber
        if (!subscriberId) {
            subscriberId = await createOrUpdateSubscriber(email, name);
        } else {
            await updateSubscriber(email, {
                status: 'active',
                fields: { name: name }
            });
        }

        // Create temporary welcome group
        const groupName = `welcome-${Date.now()}`;
        const groupId = await createTemporaryGroup(groupName);

        // Add subscriber to welcome group
        await addSubscriberToGroup(email, groupId);

        // Update subscriber with welcome email trigger fields
        const triggerFields = {
            fields: {
                name: name,
                welcome_email_trigger: 'true',
                welcome_date: new Date().toISOString(),
                user_type: 'new_user',
                last_welcome_attempt: new Date().toISOString()
            }
        };
        
        await updateSubscriber(email, triggerFields);
        
        return {
            success: true,
            subscriberId,
            groupId,
            message: 'Welcome email automation setup completed'
        };
        
    } catch (error) {
        throw new Error(`Welcome email setup failed: ${error.message}`);
    }
};

// Main account deletion email function
const sendAccountDeletionEmail = async (email, name) => {
    try {
        if (!apiKey) {
            initializeEmailService();
        }

        // Update subscriber with deletion trigger fields
        const deletionData = {
            fields: {
                name: name,
                account_deleted: 'true',
                deletion_date: new Date().toISOString()
            }
        };
        
        try {
            await updateSubscriber(email, deletionData);
            return {
                success: true,
                message: 'Account deletion email automation triggered'
            };
        } catch (updateError) {
            if (updateError.message.includes('404')) {
                // Subscriber doesn't exist, which is fine for account deletion
                return {
                    success: true,
                    message: 'Subscriber not found (already deleted), no email needed'
                };
            }
            throw updateError;
        }
        
    } catch (error) {
        throw new Error(`Account deletion email setup failed: ${error.message}`);
    }
};

// Email service status check
const getEmailServiceStatus = () => {
    return {
        initialized: !!apiKey,
        apiKeySet: !!process.env.MAILERLITE_API_KEY,
        baseUrl: MAILERLITE_API_BASE
    };
};

module.exports = {
    sendWelcomeEmail,
    sendAccountDeletionEmail,
    getEmailServiceStatus,
    initializeEmailService
};
