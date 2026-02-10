import {
    Button,
    Stack,
    Divider,
} from '@mui/material';

import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "components/auth/AuthContext";
import { useState } from 'react'; // Added to manage loading state

function OAuthButtons() {

    const navigate = useNavigate();
    const authContext = useAuth();

    // Manage loading state to disable the button
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleLoginSuccess = async (codeResponse) => {
        console.log('--- Start handleGoogleLoginSuccess (Auth Code Flow) ---');
        console.log('Code Response object received:', codeResponse); // Auth code response object log

        setIsLoading(true);

        // Extract auth code
        const authCode = codeResponse?.code;

        console.log('Extracted Auth Code:', authCode);
        console.log('Type of Auth Code:', typeof authCode);

        if (!authCode) {
            console.error("Auth code is missing from response.");
            setIsLoading(false);
            // TODO: Show a user-friendly error notification
            return false;
        }

        // Call AuthContext's Google login function (pass the auth code)
        // Ensure loginWithGoogle accepts the code
        const success = await authContext.loginWithGoogle(authCode);

        if (success) {
            navigate('/day');
        } else {
            console.error('Google login failed (AuthContext processing error)');
            // TODO: Show a user-friendly error notification
        }
        setIsLoading(false);
         console.log('--- End handleGoogleLoginSuccess ---');
    };

    // Google login failure handler
    const handleGoogleLoginFailure = (error) => {
        setIsLoading(false);
        console.error('Google login error:', error);
        // TODO: Show a user-friendly error notification
    };

    // useGoogleLogin hook (Authorization Code Flow)
    const login = useGoogleLogin({
        onSuccess: handleGoogleLoginSuccess,
        onError: handleGoogleLoginFailure,
        // clientId is set in GoogleOAuthProvider
        // Add scopes as needed, e.g., scope: 'openid email profile'
        flow: 'auth-code', // Authorization Code Flow
        // redirect_uri must match your Google Cloud Console settings
        // local: http://localhost:3000
        // production: https://your-app-domain.com
        redirect_uri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || window.location.origin // Use env var or current origin
    });

    return(
        <>
            <Divider>Or</Divider>
            <Stack spacing={1}>
                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={
                        <svg viewBox="0 0 24 24" width="22" height="22" >
                            <path d="M22.0608 12.2361C22.0608 11.5384 22.0043 10.8369 21.8836 10.1505H12.2024V14.1029H17.7464C17.5163 15.3777 16.7771 16.5053 15.6947 17.2219V19.7864H19.0022C20.9445 17.9988 22.0608 15.3588 22.0608 12.2361Z" fill="#4285F4"></path>
                            <path d="M12.2025 22.2642C14.9707 22.2642 17.3052 21.3553 19.0061 19.7864L15.6986 17.2218C14.7784 17.8479 13.5904 18.2024 12.2063 18.2024C9.52863 18.2024 7.25825 16.3959 6.44363 13.9671H3.03052V16.6109C4.7729 20.0768 8.32178 22.2642 12.2025 22.2642V22.2642Z" fill="#34A853"></path>
                            <path d="M6.43988 13.9671C6.00994 12.6924 6.00994 11.3121 6.43988 10.0373V7.39359H3.03054C1.57478 10.2938 1.57478 13.7107 3.03054 16.6109L6.43988 13.9671V13.9671Z" fill="#FBBC04"></path>
                            <path d="M12.2025 5.79829C13.6658 5.77566 15.0801 6.32629 16.1399 7.33702L19.0703 4.40665C17.2147 2.66426 14.752 1.70633 12.2025 1.7365C8.32178 1.7365 4.7729 3.92391 3.03052 7.39359L6.43986 10.0373C7.25071 7.60479 9.52486 5.79829 12.2025 5.79829V5.79829Z" fill="#EA4335"></path>
                        </svg>
                    }
                    onClick={login}
                    disabled={isLoading}
                >
                    {isLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>
            </Stack>
        </>
    )
}

export default OAuthButtons;