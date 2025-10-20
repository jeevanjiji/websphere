import React, { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import ValidatedInput from '../components/ValidatedInput';
import { validateFullName, validateEmail, validatePassword, validatePasswordConfirmation, validateBio } from '../utils/validation';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api.js';
// import { Card } from '../components/ui';

const FreelancerRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState([]);

  const [registrationData, setRegistrationData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    profilePicture: null
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  // Validation states
  const [validationResults, setValidationResults] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [bioValidation, setBioValidation] = useState(null);
  const [isBioTouched, setIsBioTouched] = useState(false);

  // Handle validation results
  const handleValidation = useCallback((fieldName, result) => {
    setValidationResults(prev => {
      const newResults = { ...prev, [fieldName]: result };

      // Check if all required fields are valid for step 1
      const step1Fields = ['fullName', 'email', 'password', 'confirmPassword'];
      const step1Valid = step1Fields.every(field =>
        newResults[field] && newResults[field].isValid
      );

      setIsFormValid(step1Valid);
      return newResults;
    });
  }, []);

  // Memoized input handler to prevent re-renders and focus loss
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle bio validation separately
    if (name === 'bio') {
      setIsBioTouched(true);
      const validation = validateBio(value);
      setBioValidation(validation);
    }
  }, []);

  const showAlert = useCallback((type, title, text) => {
    const message = text || title;

    switch (type) {
      case 'success':
        return toast.success(message, { dismissible: true });
      case 'error':
        return toast.error(message, { dismissible: true });
      case 'warning':
        return toast.error(message, { dismissible: true }); // Use error styling for warnings
      case 'info':
        return toast(message, { dismissible: true }); // Default toast for info
      default:
        return toast(message, { dismissible: true });
    }
  }, []);



  const handleBasicInfoSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Check if form is valid using validation state
    if (!isFormValid) {
      showAlert('error', 'Validation Error', 'Please fix the validation errors above');
      return;
    }

    setStep(2);
  }, [isFormValid, showAlert]);

  const handleProfilePictureChange = useCallback((e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setRegistrationData({ ...registrationData, profilePicture: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, [registrationData]);

  const handleBioSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Check bio validation
    const validation = validateBio(registrationData.bio);
    if (!validation.isValid) {
      showAlert('error', 'Bio Validation Error', validation.message);
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting registration with:', {
        fullName: registrationData.fullName,
        email: registrationData.email,
        role: 'freelancer',
        bioLength: registrationData.bio?.length || 0
      });

      // First register the user
      const registerResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: registrationData.fullName,
          email: registrationData.email,
          password: registrationData.password,
          role: 'freelancer',
          bio: registrationData.bio
        })
      });

      console.log('Registration response status:', registerResponse.status);
      console.log('Registration response ok:', registerResponse.ok);

      // Check if the response is ok before trying to parse JSON
      if (!registerResponse.ok) {
        let errorMessage = 'Registration failed. Please try again.';
        let isEmailAlreadySent = false;
        
        try {
          const errorData = await registerResponse.json();
          errorMessage = errorData.message || errorMessage;
          
          // Special case: email already sent - treat as success, not error
          if (errorMessage.includes('verification email has already been sent')) {
            isEmailAlreadySent = true;
          }
        } catch (parseError) {
          // If JSON parsing fails, use status-based message
          if (registerResponse.status === 400) {
            errorMessage = 'Invalid registration data. Please check your inputs.';
          } else if (registerResponse.status === 409) {
            errorMessage = 'Email already exists or has a pending verification.';
          } else if (registerResponse.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          }
        }
        
        // Handle "email already sent" as a success case
        if (isEmailAlreadySent) {
          showAlert('info', 'Email Already Sent', 
            'A verification email has already been sent to your email address. Please check your inbox and verify your email to complete registration.');
          
          // Store minimal registration data for verification page
          localStorage.setItem('pendingRegistration', JSON.stringify({
            email: registrationData.email,
            emailSent: true,
            devVerificationUrl: null
          }));
          
          navigate('/verify-email-notice');
          return;
        }
        
        showAlert('error', 'Registration Failed', errorMessage);
        setStep(1); // Go back to basic info step
        return;
      }

      const registerData = await registerResponse.json();

      if (!registerData.success) {
        showAlert('error', 'Registration Failed', registerData.message || 'Registration failed. Please try again.');
        setStep(1); // Go back to basic info step
        return;
      }

      // Always require email verification for freelancers
      if (registerData.emailSent) {
        showAlert('info', 'Check Your Email',
          'We\'ve sent a verification link to your email address. Please verify your email to complete your registration.');
      } else {
        // Email service unavailable - show development verification option
        showAlert('warning', 'Email Service Unavailable',
          'Email verification is temporarily unavailable. For testing purposes, you can verify your account using the development link provided.');
      }

      // Store registration data including bio for after verification
      localStorage.setItem('pendingRegistration', JSON.stringify({
        ...registrationData,
        email: registerData.email,
        emailSent: registerData.emailSent,
        devVerificationUrl: registerData.devVerificationUrl
      }));

      navigate('/verify-email-notice');
      return;


    } catch (error) {
      console.error('Registration error:', error);

      // Provide specific error messages based on error type
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showAlert('error', 'Connection Error', 
          'Unable to connect to the server. Please check your internet connection and try again.');
      } else if (error.name === 'SyntaxError') {
        showAlert('error', 'Server Error', 
          'The server returned an invalid response. Please try again later.');
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        showAlert('error', 'Network Error', 
          'Network request failed. Please check your connection and try again.');
      } else {
        showAlert('error', 'Registration Error', 
          `An unexpected error occurred: ${error.message || 'Please try again.'}`);
      }
      
      // Go back to step 1 on any error
      setStep(1);
    } finally {
      setLoading(false);
    }
  }, [registrationData, showAlert, navigate]);



  return (
    <div className="min-h-screen bg-bg-secondary overflow-hidden">
      <div className="flex min-h-screen">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary">
          <div className="absolute inset-0 bg-primary/10 z-10"></div>
          <img
            src={step === 1
              ? "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=800&fit=crop"
              : "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=800&fit=crop"
            }
            alt="Freelancer workspace"
            className="w-full h-full object-cover transition-all duration-700 opacity-20"
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <div className="text-center text-white px-8">
              <h2 className="heading-2 mb-4 text-white">
                {step === 1 ? "Join Our Community" : "Show Your Expertise"}
              </h2>
              <p className="body-large text-white/90">
                {step === 1
                  ? "Start your freelancing journey with WebSphere"
                  : "Tell us about your skills and experience"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 min-h-screen overflow-y-auto bg-white">
          <div className="w-full max-w-md">
            <Link
              to="/login"
              className="flex items-center gap-2 text-gray-medium hover:text-gray-dark transition-colors group mb-6"
            >
              <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Login</span>
            </Link>

                <div className="bg-white rounded-xl shadow-xl p-8">
                  <div className="text-center mb-6">
                    <h1 className="heading-3 mb-2">
                      Freelancer Registration
                    </h1>
                    <p className="body-regular">
                      {step === 1 ? 'Start your freelancing journey' : 'Tell us about your skills'}
                    </p>
                  </div>

          {step === 1 ? (
            <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
              <ValidatedInput
                type="text"
                name="fullName"
                value={registrationData.fullName}
                onChange={handleInputChange}
                onValidation={handleValidation}
                validator={validateFullName}
                label="Full Name"
                placeholder="Enter your full name (e.g., John Smith)"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />

              <ValidatedInput
                type="email"
                name="email"
                value={registrationData.email}
                onChange={handleInputChange}
                onValidation={handleValidation}
                validator={validateEmail}
                label="Email Address"
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />

              <div className="relative">
                <ValidatedInput
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={registrationData.password}
                  onChange={handleInputChange}
                  onValidation={handleValidation}
                  validator={validatePassword}
                  label="Password"
                  placeholder="Create a strong password"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              <div className="relative">
                <ValidatedInput
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={registrationData.confirmPassword}
                  onChange={handleInputChange}
                  onValidation={handleValidation}
                  validator={(value) => validatePasswordConfirmation(registrationData.password, value)}
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={!isFormValid}
                className="w-full font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 bg-primary hover:bg-primary/90 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
              </button>

              {!isFormValid && Object.keys(validationResults).length > 0 && (
                <p className="text-error text-sm text-center mt-2">
                  Please fix the validation errors above
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleBioSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Picture (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div
                    className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 hover:border-primary transition-colors cursor-pointer flex-shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <PhotoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <PhotoIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleProfilePictureChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <p className="text-sm text-gray-600 mb-1">Upload your profile picture</p>
                    <p className="text-xs text-gray-500">JPG, PNG or GIF (max 5MB)</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  autoComplete="off"
                  value={registrationData.bio}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none ${
                    isBioTouched && bioValidation
                      ? bioValidation.isValid
                        ? 'border-green-500'
                        : 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Tell us about your skills and experience (min 20 characters)..."
                />
                {isBioTouched && bioValidation && (
                  <p className={`text-sm mt-1 ${
                    bioValidation.type === 'error' ? 'text-error' :
                    bioValidation.type === 'warning' ? 'text-warning' :
                    'text-success'
                  }`}>
                    {bioValidation.message}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Mention your skills and technologies. We'll automatically detect and tag them.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (isBioTouched && bioValidation && !bioValidation.isValid)}
                  className={`flex-1 font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 ${
                    loading || (isBioTouched && bioValidation && !bioValidation.isValid)
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Registering...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          )}
                </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreelancerRegistration;
