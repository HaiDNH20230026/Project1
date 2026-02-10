import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import OAuthButtons from './OAuthButtons';
import { useFormik } from 'formik';
import * as Yup from 'yup';

function SignInEmailForm({ onNext }) {

    const formik = useFormik({
            initialValues: {
              email: ''
            },
                        validationSchema: Yup.object({
                            email: Yup.string()
                                .email('Please enter a valid email address')
                                .required('Email is required')
                        }),
            onSubmit: async (values) => {
                // const success = await checkEmailAvailability(email);
                // if(success)
                onNext(values.email);
            }
            // onSubmit: ({ email }) => {
            //     onNext(email);
            // }
    });

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center', // Wedvertical center
                justifyContent: 'center', // Wedhorizontal center
                backgroundColor: '#fff',
                width: '50vw'
            }}
        >
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', maxWidth: 300 }}>
                <Stack spacing={2}>
                    <Stack spacing={1}>
                        <Typography variant="h5" fontWeight="bold">
                            Sign In
                        </Typography>

                        <Typography sx={{color:'#666666', fontSize:'16px'}}>
                            Continue to Calendar
                        </Typography>
                    </Stack>
                    <Stack spacing={2}>
                        <TextField 
                            fullWidth 
                            label="Email"
                            name="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email} />

                        <Button 
                            type="submit" 
                            variant="contained" 
                            fullWidth 
                            size="large">
                            Continue
                        </Button>

                        <Typography fontSize={14}>
                            New to Calendar? {' '}
                            <a
                                href="/signup"
                                style={{ textDecoration: 'none', color: '#1976d2' }}>
                                Create Account
                            </a>
                        </Typography>
                    </Stack>

                    <OAuthButtons />
                </Stack>
                
            </Box>
        </Box>
    );
}

export default SignInEmailForm;