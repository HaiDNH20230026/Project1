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

function SignUpEmailForm({ onNext }) {

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
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fff',
                width: '50vw'
            }}
        >
            <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%', maxWidth: 300 }}>
                <Stack spacing={2}>

                    <Stack spacing={1}>
                        <Typography variant="h5" fontWeight="bold">
                            Create Account
                        </Typography>

                        <Typography sx={{color:'#666666', fontSize:'11px'}}>
                            By clicking this, you agree to the
                            <a 
                                href=" "
                                style={{ textDecoration: 'none', color: '#1976d2' }}>
                                    Terms of Service
                            </a> and
                            <a 
                                href=" "
                                style={{ textDecoration: 'none', color: '#1976d2' }}>
                                Privacy Policy
                            </a>.
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
                            Already have an account?{' '}
                            <a
                                href="/signin"
                                style={{ textDecoration: 'none', color: '#1976d2' }}>
                                Sign In
                            </a>
                        </Typography>
                    </Stack>

                    <OAuthButtons />
                </Stack>
                
            </Box>
        </Box>
    );
}

export default SignUpEmailForm;