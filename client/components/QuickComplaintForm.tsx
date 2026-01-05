import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";
import OtpDialog from "./OtpDialog";
import { useSubmitGuestComplaintMutation } from "../store/api/guestApi";
import { getApiErrorMessage } from "../store/api/baseApi";
import { selectWardsArray, selectSubZonesByWardId, selectWardById } from "../store/slices/dataSlice";

// Define types locally instead of importing from deprecated slice
type ComplaintType =
  | "WATER_SUPPLY"
  | "ELECTRICITY"
  | "ROAD_REPAIR"
  | "GARBAGE_COLLECTION"
  | "STREET_LIGHTING"
  | "SEWERAGE"
  | "PUBLIC_HEALTH"
  | "TRAFFIC"
  | "OTHERS";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
import {
  submitGuestComplaint,
  clearGuestData,
  FileAttachment,
  GuestComplaintData,
} from "../store/slices/guestSlice";
import {
  useVerifyGuestOtpMutation,
  useGenerateCaptchaQuery,
  useLazyGenerateCaptchaQuery,
} from "../store/api/guestApi";
import { useGetWardsQuery } from "../store/api/wardApi";

// Import Ward and SubZone types
interface Ward {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: SubZone[];
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
  isActive: boolean;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
}
import { useResendGuestOtpMutation } from "../store/api/guestApi";
import { selectAuth, setCredentials } from "../store/slices/authSlice";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import SimpleLocationMapDialog from "./SimpleLocationMapDialog";
import {
  MapPin,
  Upload,
  RefreshCw,
  FileText,
  Zap,
  Wrench,
  Droplets,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import { createComplaint } from "@/store/slices/complaintsSlice";
import { useConfigManager } from "../hooks/useConfigManager";
import { prewarmMapAssets } from "../utils/mapTilePrefetch";
import { emailSchema, nameSchema, phoneSchema } from "../lib/validations";

interface QuickComplaintFormProps {
  onSuccess?: (complaintId: string) => void;
  onClose?: () => void;
}

interface FormData {
  fullName: string;
  mobile: string;
  email: string;
  problemType: string;
  ward: string;
  subZoneId?: string;
  area: string;
  location: string;
  address: string;
  description: string;
  coordinates: { latitude: number; longitude: number } | null;
}

const QuickComplaintForm: React.FC<QuickComplaintFormProps> = ({
  onSuccess,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { complaintTypeOptions } = useComplaintTypes();

  // Get wards from Redux state
  const wardsFromRedux = useAppSelector(selectWardsArray);

  // Still use RTK Query for loading state and triggering API calls
  const {
    data: wardsResponse,
    isLoading: wardsLoading,
    error: wardsError,
    refetch: refetchWards,
  } = useGetWardsQuery({ includeSubzones: true }, {
    // Force refetch to avoid cache issues
    refetchOnMountOrArgChange: true,
    // Skip cache entirely for debugging
    refetchOnReconnect: true,
    refetchOnFocus: true,
  });



  // Use wards from Redux state
  const wards = useMemo(() => {
    return wardsFromRedux;
  }, [wardsFromRedux]);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    mobile: "",
    email: "",
    problemType: "",
    ward: "",
    subZoneId: "",
    area: "",
    location: "",
    address: "",
    description: "",
    coordinates: null,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"citizen" | "guest">(
    isAuthenticated ? "citizen" : "guest",
  );
  const [otpCode, setOtpCode] = useState("");
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);

  const { toast } = useToast();
  const { getConfig, getBrandingConfig } = useConfigManager();

  // Get branding configuration for complaint prefix and other settings
  const brandingConfig = getBrandingConfig();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();
  const [resendGuestOtp] = useResendGuestOtpMutation();
  const [submitGuestComplaintMutation, { isLoading: isSendingOtp }] =
    useSubmitGuestComplaintMutation();
  const [
    generateCaptcha,
    { data: captchaData, isLoading: captchaLoading, error: captchaError },
  ] = useLazyGenerateCaptchaQuery();

  // Get sub-zones and ward from Redux state
  const subZonesForWard = useAppSelector(selectSubZonesByWardId(formData.ward));
  const selectedWard = useAppSelector(selectWardById(formData.ward));

  const guestIsSubmitting = useAppSelector((state) => state.guest.isSubmitting);

  // Pre-fill user data if authenticated and set submission mode
  useEffect(() => {
    if (isAuthenticated && user) {
      setSubmissionMode("citizen");
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        mobile: user.phoneNumber || "",
        email: user.email || "",
        ward: user.wardId || "",
        subZoneId: "",
      }));
    } else {
      setSubmissionMode("guest");
    }
  }, [isAuthenticated, user]);

  // Log when sub-zones become available/unavailable
  useEffect(() => {
    if (formData.ward && subZonesForWard.length > 0) {
      toast({
        title: "Sub-zones Available",
        description: `${subZonesForWard.length} sub-zones are available for the selected ward. You can optionally select one for more precise location.`,
        duration: 3000,
      });
    }
  }, [formData.ward, subZonesForWard, toast]);

  // Generate CAPTCHA on component mount
  useEffect(() => {
    handleRefreshCaptcha();
  }, []);



  // Prewarm map assets (tiles + leaflet) using system-config default center
  useEffect(() => {
    const lat = parseFloat(getConfig("MAP_DEFAULT_LAT", "9.9312")) || 9.9312;
    const lng = parseFloat(getConfig("MAP_DEFAULT_LNG", "76.2673")) || 76.2673;
    prewarmMapAssets(lat, lng, 13);
  }, [getConfig]);

  // Update CAPTCHA ID when new CAPTCHA is generated
  useEffect(() => {
    if (captchaData?.success && captchaData.data) {
      setCaptchaId(captchaData.data.captchaId);
    }
  }, [captchaData]);

  // Handle CAPTCHA refresh
  const handleRefreshCaptcha = useCallback(() => {
    setCaptcha("");
    setCaptchaId(null);
    generateCaptcha();
  }, [generateCaptcha]);

  // Icon mapping for different complaint types
  const getIconForComplaintType = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      WATER_SUPPLY: <Droplets className="h-4 w-4" />,
      ELECTRICITY: <Zap className="h-4 w-4" />,
      ROAD_REPAIR: <Wrench className="h-4 w-4" />,
      WASTE_MANAGEMENT: <FileText className="h-4 w-4" />,
      GARBAGE_COLLECTION: <FileText className="h-4 w-4" />,
      STREET_LIGHTING: <Zap className="h-4 w-4" />,
      DRAINAGE: <Droplets className="h-4 w-4" />,
      SEWERAGE: <Droplets className="h-4 w-4" />,
      PUBLIC_TOILET: <CheckCircle className="h-4 w-4" />,
      TREE_CUTTING: <Wrench className="h-4 w-4" />,
      PUBLIC_HEALTH: <CheckCircle className="h-4 w-4" />,
      TRAFFIC: <AlertCircle className="h-4 w-4" />,
      OTHERS: <FileText className="h-4 w-4" />,
    };
    return iconMap[type] || <FileText className="h-4 w-4" />;
  };

  const problemTypes = complaintTypeOptions.map((type) => ({
    key: type.value,
    label: type.label,
    icon: getIconForComplaintType(type.value),
  }));
  const validateField = (field: keyof FormData | "captcha", value: string) => {
    try {
      switch (field) {
        case "fullName":
          nameSchema.parse(value);
          break;
        case "mobile":
          phoneSchema.parse(value);
          break;
        case "email":
          if (submissionMode === "guest") {
            emailSchema.parse(value);
          } else if (value) {
            emailSchema.parse(value);
          }
          break;
        case "area":
          if (!value || value.trim().length < 3)
            throw new Error(translations?.forms?.areaMinCharacters || "Area must be at least 3 characters");
          break;
        case "description":
          if (!value || value.trim().length < 10)
            throw new Error(translations?.forms?.descriptionMinCharacters || "Description must be at least 10 characters");
          break;
        case "captcha":
          if (!value)
            throw new Error(translations?.forms?.completeCaptchaVerification || "Please complete the CAPTCHA verification");
          break;
        default:
          break;
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (e: any) {
      const msg = e?.errors?.[0]?.message || e?.message || "Invalid value";
      setErrors((prev) => ({ ...prev, [field]: msg }));
    }
  };



  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Clear sub-zone when ward changes
      if (field === "ward") {
        newData.subZoneId = "";
        console.log("Ward changed, clearing sub-zone");
      }

      return newData;
    });
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "video/mp4",
        "video/webm",
        "video/ogg",
      ];
      const validFiles: File[] = [];

      selectedFiles.forEach((file) => {
        if (allowedTypes.includes(file.type)) {
          validFiles.push(file);
        } else {
          dispatch(
            showErrorToast(
              translations?.forms?.invalidFileType || "Invalid File Type",
              translations?.forms?.onlyJpgPngAllowed || "Only JPG and PNG images are allowed",
            ),
          );
        }
      });

      if (validFiles.length) {
        setFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [dispatch],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLocationSelect = useCallback(
    (location: {
      latitude: number;
      longitude: number;
      address?: string;
      area?: string;
      landmark?: string;
    }) => {
      setFormData((prev) => ({
        ...prev,
        location: location.landmark || location.address || "",
        area: location.area || prev.area,
        address: location.address || prev.address,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (
        (submissionMode === "guest" ? guestIsSubmitting : isLoading) ||
        isSubmittingLocal
      )
        return;
      setIsSubmittingLocal(true);
      if (!captcha || !captchaId) {
        dispatch(
          showErrorToast(
            translations?.forms?.invalidCaptcha || "Invalid CAPTCHA",
            translations?.forms?.enterCaptcha ||
            "Please enter the CAPTCHA code",
          ),
        );
        return;
      }

      if (
        !formData.fullName ||
        !formData.mobile ||
        !formData.problemType ||
        !formData.ward ||
        !formData.area ||
        !formData.description
      ) {
        dispatch(
          showErrorToast(
            translations?.forms?.requiredField || "Required Field",
            translations?.forms?.requiredField ||
            "Please fill all required fields",
          ),
        );
        return;
      }

      // Validate sub-zone if selected
      if (formData.subZoneId) {
        const validSubZone = subZonesForWard.find((sz: any) => sz.id === formData.subZoneId);
        if (!validSubZone) {
          dispatch(
            showErrorToast(
              translations?.forms?.invalidSubZone || "Invalid Sub-Zone",
              translations?.forms?.selectedSubZoneNotValid || "The selected sub-zone is not valid for the chosen ward.",
            ),
          );
          return;
        }
      }

      try {
        if (submissionMode === "citizen" && isAuthenticated) {
          // Citizen flow: Submit directly to authenticated API
          // Get the complaint type name from the ID
          const selectedComplaintType = complaintTypeOptions.find(
            (type) => type.value === formData.problemType
          );

          const complaintData = {
            title: `${selectedComplaintType?.label || formData.problemType} complaint`,
            description: formData.description,
            type: formData.problemType as ComplaintType,
            complaintTypeId: parseInt(formData.problemType), // Send as ID for new backend
            priority: "MEDIUM" as Priority,
            wardId: formData.ward,
            ...(formData.subZoneId && { subZoneId: formData.subZoneId }),
            area: formData.area,
            ...(formData.location && { landmark: formData.location }),
            ...(formData.address && { address: formData.address }),
            ...(formData.coordinates && { coordinates: formData.coordinates }),
            ...(captcha && { captchaText: captcha }),
            ...(captchaId && { captchaId: captchaId }),
            ...(user?.fullName && { contactName: user.fullName }),
            ...(formData.email && { contactEmail: formData.email }),
            ...(formData.mobile && { contactPhone: formData.mobile }),
            isAnonymous: false,
          };

          const result = await dispatch(
            createComplaint(complaintData),
          ).unwrap();
          console.warn(result);
          toast({
            title: translations?.forms?.complaintSubmittedSuccessfully || "Complaint Submitted Successfully!",
            description: translations?.forms?.complaintRegisteredWithId?.replace('{{complaintId}}', result.complaintId) || `Your complaint has been registered with ID: ${result.complaintId}. You can track its progress from your dashboard.`,
          });

          // Reset form and call success callback
          resetForm();
          onSuccess?.(result.id);
        } else {
          // Guest flow: Send OTP initiation (no attachments here)
          const submissionData = new FormData();
          submissionData.append("fullName", formData.fullName);
          submissionData.append("email", formData.email);
          submissionData.append("phoneNumber", formData.mobile);
          if (captchaId) submissionData.append("captchaId", String(captchaId));
          if (captcha) submissionData.append("captchaText", captcha);

          const response =
            await submitGuestComplaintMutation(submissionData).unwrap();
          const result: any = response?.data || response;

          if (result?.sessionId) {
            setSessionId(result.sessionId);
            setShowOtpInput(false);
            setShowOtpDialog(true);
            toast({
              title: translations?.forms?.verificationCodeSent || "Verification Code Sent",
              description: translations?.forms?.verificationCodeSentToEmail?.replace('{{email}}', formData.email) || `A verification code has been sent to ${formData.email}. Please check your email and enter the code below.`,
            });
          }
        }
      } catch (error: any) {
        console.error("Complaint submission error:", error);
        const message =
          typeof error === "string" ? error : getApiErrorMessage(error);
        toast({
          title: translations?.forms?.submissionFailed || "Submission Failed",
          description:
            message || translations?.forms?.failedToSubmitComplaint || "Failed to submit complaint. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSubmittingLocal(false);
      }
    },
    [
      isLoading,
      captcha,
      captchaId,
      formData,
      submissionMode,
      isAuthenticated,
      user,
      files,
      dispatch,
      translations,
      toast,
      onSuccess,
    ],
  );

  // Handle OTP verification and final submission
  const handleVerifyOtp = useCallback(
    async (code?: string) => {
      const inputCode = code ?? otpCode;
      if (!inputCode || inputCode.length !== 6) {
        toast({
          title: translations?.forms?.invalidCode || "Invalid Code",
          description: translations?.forms?.enterValid6DigitCode || "Please enter a valid 6-digit verification code.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsVerifyingOtp(true);
        const fd = new FormData();
        fd.append("email", formData.email);
        fd.append("otpCode", inputCode);
        fd.append("fullName", formData.fullName);
        fd.append("phoneNumber", formData.mobile);
        fd.append("type", formData.problemType);
        fd.append("description", formData.description);
        fd.append("priority", "MEDIUM");
        fd.append("wardId", formData.ward);
        if (formData.subZoneId) fd.append("subZoneId", formData.subZoneId);
        fd.append("area", formData.area);
        if (formData.location) fd.append("landmark", formData.location);
        if (formData.address) fd.append("address", formData.address);
        if (formData.coordinates)
          fd.append("coordinates", JSON.stringify(formData.coordinates));
        for (const file of files) fd.append("attachments", file);

        const result = await verifyGuestOtp(fd).unwrap();

        if (result.data?.token && result.data?.user) {
          dispatch(
            setCredentials({
              token: result.data.token,
              user: result.data.user,
            }),
          );
          localStorage.setItem("token", result.data.token);
        }

        toast({
          title: translations?.forms?.success || "Success!",
          description: result.data?.isNewUser
            ? translations?.forms?.complaintVerifiedAccountCreated || "Your complaint has been verified and your citizen account has been created successfully!"
            : translations?.forms?.complaintVerifiedLoggedIn || "Your complaint has been verified and you've been logged in successfully!",
        });

        resetForm();
        setShowOtpInput(false);
        setSessionId(null);
        setOtpCode("");
        setShowOtpDialog(false);
        onSuccess?.(result.data?.complaint?.id || "");
      } catch (error: any) {
        console.error("OTP verification error:", error);
        const message =
          typeof error === "string" ? error : getApiErrorMessage(error);
        toast({
          title: translations?.forms?.verificationFailed || "Verification Failed",
          description:
            message || translations?.forms?.invalidVerificationCode || "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsVerifyingOtp(false);
      }
    },
    [otpCode, formData, files, verifyGuestOtp, dispatch, toast, onSuccess],
  );

  const resetForm = useCallback(() => {
    setFormData({
      fullName: "",
      mobile: isAuthenticated && user ? user.phoneNumber || "" : "",
      email: isAuthenticated && user ? user.email || "" : "",
      problemType: "",
      ward: isAuthenticated && user ? user.wardId || "" : "",
      subZoneId: "",
      area: "",
      location: "",
      address: "",
      description: "",
      coordinates: null,
    });
    setFiles([]);
    setCaptcha("");
    setCaptchaId(null);
    setOtpCode("");
    setSessionId(null);
    setShowOtpInput(false);
    handleRefreshCaptcha();
  }, [isAuthenticated, user, handleRefreshCaptcha]);

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary-foreground" />
              </div>
              <span>
                {translations?.complaints?.registerComplaint ||
                  "Register Complaint"}
              </span>
              {!isAuthenticated && (
                <Badge variant="secondary" className="ml-2">
                  {(translations as any)?.auth?.guestMode || "Guest Mode"}
                </Badge>
              )}
            </CardTitle>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.contactInformation ||
                  "Contact Information"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    {translations?.auth?.fullName || "Full Name"} *
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    onBlur={() => validateField("fullName", formData.fullName)}
                    placeholder={translations?.forms?.enterYourFullName || `${translations?.common?.name || "Enter your"} ${translations?.auth?.fullName || "full name"}`}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">
                    {translations?.complaints?.mobile || "Mobile Number"} *
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) =>
                      handleInputChange("mobile", e.target.value)
                    }
                    onBlur={() => validateField("mobile", formData.mobile)}
                    placeholder={translations?.forms?.enterYourMobileNumber || `${translations?.common?.required || "Enter your"} ${translations?.complaints?.mobile || "mobile number"}`}
                    required
                    disabled={isAuthenticated && !!user?.phoneNumber}
                  />
                  {errors.mobile && (
                    <p className="text-sm text-red-500">{errors.mobile}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email ">
                    {translations?.auth?.email || "Email Address"} *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    onBlur={() => validateField("email", formData.email)}
                    placeholder={translations?.forms?.enterYourEmailAddress || `${"Enter your"} ${translations?.auth?.email || "email address"}`}
                    disabled={isAuthenticated && !!user?.email}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Problem Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.problemDetails || "Problem Details"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="problem-type">
                    {translations?.complaints?.complaintType ||
                      "Complaint Type"}{" "}
                    *
                  </Label>
                  <Select
                    value={formData.problemType}
                    onValueChange={(value) =>
                      handleInputChange("problemType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={translations?.forms?.selectComplaintType || `${translations?.common?.selectAll || "Select"} ${translations?.complaints?.complaintType || "complaint type"}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {problemTypes.map((type) => (
                        <SelectItem key={type.key} value={type.key}>
                          <div className="flex items-center space-x-2">
                            {type.icon}
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ward">
                      {translations?.complaints?.ward || "Ward"} *
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          console.log("🔄 Manually refreshing wards...");
                          console.log("Current Redux wards:", wardsFromRedux);

                          // Test direct API call first
                          try {
                            console.log("🧪 Testing direct API during refresh...");
                            const response = await fetch('/api/users/wards?include=subzones');
                            const data = await response.json();
                            console.log("🧪 Direct API during refresh:", data);
                            console.log("🧪 First ward subZones during refresh:", data.data?.wards?.[0]?.subZones);
                          } catch (error) {
                            console.error("🧪 Direct API refresh test failed:", error);
                          }

                          // Then do RTK Query refetch
                          refetchWards();
                        }}
                        disabled={wardsLoading}
                      >
                        {wardsLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Refresh
                      </Button>
                      {process.env.NODE_ENV === 'development' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log("🔧 Force adding sub-zones to all wards...");

                            // Create wards with sub-zones manually
                            const wardsWithSubZones = [
                              {
                                id: "cmjqqzdag00159kyoxm2lnqu5",
                                name: "Ward 1 - Fort Kochi",
                                description: "Historic Fort Kochi area",
                                isActive: true,
                                subZones: [
                                  { id: "sub-1-1", name: "Fort Kochi Beach", wardId: "cmjqqzdag00159kyoxm2lnqu5", isActive: true },
                                  { id: "sub-1-2", name: "Mattancherry", wardId: "cmjqqzdag00159kyoxm2lnqu5", isActive: true },
                                  { id: "sub-1-3", name: "Princess Street", wardId: "cmjqqzdag00159kyoxm2lnqu5", isActive: true }
                                ]
                              },
                              {
                                id: "cmjqqzdao00169kyokj4olf8p",
                                name: "Ward 2 - Ernakulam",
                                description: "Central business district",
                                isActive: true,
                                subZones: [
                                  { id: "sub-2-1", name: "Broadway", wardId: "cmjqqzdao00169kyokj4olf8p", isActive: true },
                                  { id: "sub-2-2", name: "Marine Drive", wardId: "cmjqqzdao00169kyokj4olf8p", isActive: true },
                                  { id: "sub-2-3", name: "MG Road", wardId: "cmjqqzdao00169kyokj4olf8p", isActive: true }
                                ]
                              },
                              {
                                id: "cmjqqzdaq00179kyox306yzqs",
                                name: "Ward 3 - Kadavanthra",
                                description: "Residential area",
                                isActive: true,
                                subZones: [
                                  { id: "sub-3-1", name: "Kadavanthra Junction", wardId: "cmjqqzdaq00179kyox306yzqs", isActive: true },
                                  { id: "sub-3-2", name: "Kaloor", wardId: "cmjqqzdaq00179kyox306yzqs", isActive: true },
                                  { id: "sub-3-3", name: "Panampilly Nagar", wardId: "cmjqqzdaq00179kyox306yzqs", isActive: true }
                                ]
                              },
                              {
                                id: "cmjqqzdb100189kyonx2234b1",
                                name: "Ward 4 - Palarivattom",
                                description: "IT hub area",
                                isActive: true,
                                subZones: [
                                  { id: "sub-4-1", name: "Changampuzha Park", wardId: "cmjqqzdb100189kyonx2234b1", isActive: true },
                                  { id: "sub-4-2", name: "Edappally", wardId: "cmjqqzdb100189kyonx2234b1", isActive: true },
                                  { id: "sub-4-3", name: "Palarivattom Junction", wardId: "cmjqqzdb100189kyonx2234b1", isActive: true }
                                ]
                              },
                              {
                                id: "cmjqqzdbb00199kyo006kynl3",
                                name: "Ward 5 - Kakkanad",
                                description: "IT corridor",
                                isActive: true,
                                subZones: [
                                  { id: "sub-5-1", name: "Info Park", wardId: "cmjqqzdbb00199kyo006kynl3", isActive: true },
                                  { id: "sub-5-2", name: "Kakkanad Township", wardId: "cmjqqzdbb00199kyo006kynl3", isActive: true },
                                  { id: "sub-5-3", name: "Seaport Airport Road", wardId: "cmjqqzdbb00199kyo006kynl3", isActive: true }
                                ]
                              },
                              {
                                id: "cmjqqzdbe001a9kyoo0tonse4",
                                name: "Ward 6 - Thripunithura",
                                description: "Historic town",
                                isActive: true,
                                subZones: [
                                  { id: "sub-6-1", name: "Hill Palace", wardId: "cmjqqzdbe001a9kyoo0tonse4", isActive: true },
                                  { id: "sub-6-2", name: "Poornathrayeesa Temple", wardId: "cmjqqzdbe001a9kyoo0tonse4", isActive: true },
                                  { id: "sub-6-3", name: "Thripunithura Market", wardId: "cmjqqzdbe001a9kyoo0tonse4", isActive: true }
                                ]
                              }
                            ];

                            // Import and dispatch directly to Redux
                            import('../store/slices/dataSlice').then(({ setWardsWithSubZones }) => {
                              dispatch(setWardsWithSubZones(wardsWithSubZones));
                              console.log("✅ Manually populated wards with sub-zones");
                            });
                          }}
                        >
                          Load Real Sub-zones
                        </Button>
                      )}
                    </div>
                  </div>
                  <Select
                    value={formData.ward}
                    onValueChange={(value) => handleInputChange("ward", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={translations?.forms?.selectYourWard || `${translations?.common?.selectAll || "Select your"} ${translations?.complaints?.ward || "ward"}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wardsLoading ? (
                        <SelectItem value="loading" disabled>
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{translations?.forms?.loadingWards || "Loading wards..."}</span>
                          </div>
                        </SelectItem>
                      ) : wardsError ? (
                        <SelectItem value="error" disabled>
                          <div className="text-red-500">
                            {translations?.forms?.errorLoadingWards || "Error loading wards"} - {JSON.stringify(wardsError)}
                          </div>
                        </SelectItem>
                      ) : wards.length === 0 ? (
                        <SelectItem value="no-wards" disabled>
                          <div className="text-orange-500">
                            No wards available - Database may not be seeded. Response: {JSON.stringify(wardsResponse)}
                          </div>
                        </SelectItem>
                      ) : (
                        wards.map((ward: Ward, index: number) => {
                          console.log(`Rendering ward ${index}:`, ward);
                          if (!ward || !ward.id || !ward.name) {
                            console.warn("Invalid ward data:", ward);
                            return null;
                          }
                          const hasSubZones = ward.subZones && ward.subZones.length > 0;
                          return (
                            <SelectItem key={ward.id} value={ward.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{ward.name}</span>
                                {hasSubZones && ward.subZones && (
                                  <span className="text-xs text-blue-500 ml-2">
                                    ({ward.subZones.length} sub-zones)
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        }).filter(Boolean)
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.locationDetails || "Location Details"}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="area">
                    {translations?.complaints?.area || "Area"} *
                  </Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    onBlur={() => validateField("area", formData.area)}
                    placeholder={
                      translations?.forms?.minCharacters ||
                      "Enter area (minimum 3 characters)"
                    }
                    required
                  />
                  {errors.area && (
                    <p className="text-sm text-red-500">{errors.area}</p>
                  )}
                </div>

                {/* Sub-Zone Selection - shows when ward is selected */}
                {formData.ward && (
                  <div className="space-y-2">
                    <Label htmlFor="subZone">
                      {(translations as any)?.complaints?.subZone || "Sub-Zone"}
                      <span className="text-sm text-muted-foreground ml-1">
                        (Optional - {subZonesForWard.length} available)
                      </span>
                      {/* Real-time debug info */}
                      <span className="text-xs text-blue-600 ml-2">
                        [Debug: Ward={formData.ward}, Found={subZonesForWard.length}]
                      </span>
                    </Label>
                    <Select
                      value={formData.subZoneId || "none"}
                      onValueChange={(value) => {
                        console.log("Sub-zone selected:", value);
                        console.log("Available sub-zones at selection time:", subZonesForWard);
                        // Convert "none" back to empty string for the form data
                        const actualValue = value === "none" ? "" : value;
                        handleInputChange("subZoneId", actualValue);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            subZonesForWard.length > 0
                              ? (translations?.common?.selectAll || "Select sub-zone (optional)")
                              : "No sub-zones available for this ward"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          <span className="text-muted-foreground">No specific sub-zone</span>
                        </SelectItem>
                        {subZonesForWard.length > 0 ? (
                          subZonesForWard.map((sz: any) => {
                            console.log("🎯 Rendering sub-zone in UI:", sz);
                            return (
                              <SelectItem key={sz.id} value={sz.id}>
                                {sz.name}
                                {sz.description && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    - {sz.description}
                                  </span>
                                )}
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="no-subzones" disabled>
                            <span className="text-muted-foreground">
                              No sub-zones configured for this ward
                            </span>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {/* Enhanced debug info */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="text-xs text-gray-500 mt-1 p-2 bg-gray-50 rounded">
                        <div>🔍 Debug Info:</div>
                        <div>Ward ID: {formData.ward}</div>
                        <div>Sub-zones count: {subZonesForWard.length}</div>
                        <div>Selected ward object: {selectedWard ? '✅ Found' : '❌ Not found'}</div>
                        {subZonesForWard.length > 0 && (
                          <div>Available: {subZonesForWard.map((sz: any) => sz.name).join(', ')}</div>
                        )}
                        {selectedWard && (
                          <div>Ward has subZones property: {selectedWard.subZones ? '✅ Yes' : '❌ No'}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="location">
                    {translations?.complaints?.location || "Location/Landmark"}
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder={`${translations?.complaints?.landmark || "Specific location or landmark"}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsMapDialogOpen(true)}
                      title="Select location on map"
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">
                    {(translations as any)?.complaints?.address ||
                      "Full Address"}
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    placeholder={`${(translations as any)?.complaints?.address || "Complete address details"}...`}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Complaint Description */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.complaintDescription ||
                  "Complaint Description"}
              </h3>
              <div className="space-y-2">
                <Label htmlFor="description">
                  {(translations as any)?.complaints?.description ||
                    (translations as any)?.forms?.description ||
                    "Description"}{" "}
                  *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  onBlur={() =>
                    validateField("description", formData.description)
                  }
                  placeholder={`${translations?.forms?.complaintDescription || "Describe your complaint in detail"}...`}
                  rows={4}
                  required
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* File Uploads */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.optionalUploads || "Optional Uploads"}
              </h3>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    {translations?.common?.upload || "Upload"}{" "}
                    {translations?.complaints?.files ||
                      "images, videos, or PDF files"}
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/jpg,video/mp4,video/webm,video/ogg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>
                        {translations?.common?.upload || "Upload"}{" "}
                        {translations?.complaints?.files || "Files"}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    {translations?.complaints?.files || "Uploaded Files"}:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {files.map((file, index) => {
                      const url = URL.createObjectURL(file);
                      const isImage = file.type.startsWith("image/");
                      const isVideo = file.type.startsWith("video/");
                      return (
                        <div
                          key={index}
                          className="relative rounded border overflow-hidden"
                        >
                          <button
                            type="button"
                            className="absolute top-1 right-1 z-10 bg-white/80 rounded-full px-2 py-0.5 text-xs"
                            onClick={() => removeFile(index)}
                            aria-label={`Remove ${file.name}`}
                          >
                            ×
                          </button>
                          {isImage ? (
                            <img
                              src={url}
                              alt={file.name}
                              className="w-full h-32 object-cover"
                            />
                          ) : isVideo ? (
                            <video
                              src={url}
                              className="w-full h-32 object-cover"
                              controls
                            />
                          ) : (
                            <div className="p-3 text-sm break-all">
                              {file.name}
                            </div>
                          )}
                          <div className="p-2 text-xs text-gray-600 truncate">
                            {file.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* CAPTCHA */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {translations?.forms?.captchaVerification ||
                  "CAPTCHA Verification"}{" "}
                *
              </h3>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 p-2 rounded border min-h-[60px] flex items-center justify-center">
                  {captchaLoading ? (
                    <div className="text-sm text-gray-500">
                      {translations?.forms?.loadingCaptcha || "Loading CAPTCHA..."}
                    </div>
                  ) : captchaError ? (
                    <div className="text-sm text-red-500">
                      {translations?.forms?.errorLoadingCaptcha || "Error loading CAPTCHA"}
                    </div>
                  ) : captchaData?.success && captchaData.data ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: captchaData.data.captchaSvg,
                      }}
                      className="captcha-svg"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">
                      {translations?.forms?.clickRefreshCaptcha || "Click refresh to load CAPTCHA"}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshCaptcha}
                  disabled={captchaLoading}
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${captchaLoading ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>
              <Input
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                onBlur={() => validateField("captcha", captcha)}
                placeholder={
                  translations?.forms?.enterCaptcha ||
                  "Enter the code shown above"
                }
                required
              />
              {errors.captcha && (
                <p className="text-sm text-red-500">{errors.captcha}</p>
              )}
            </div>

            {/* OTP Input Section for Guest Users */}
            {showOtpInput && submissionMode === "guest" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">{translations?.forms?.emailVerification || "Email Verification"}</h3>
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otpCode" className="text-center block">
                        {translations?.forms?.enterVerificationCode || "Enter Verification Code"}
                      </Label>
                      <Input
                        id="otpCode"
                        name="otpCode"
                        type="text"
                        placeholder={translations?.forms?.enter6DigitCode || "Enter 6-digit code"}
                        maxLength={6}
                        className="text-center text-xl font-mono tracking-widest"
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      {translations?.forms?.codeSentTo || "Code sent to"}: {formData.email}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={() => handleVerifyOtp()}
                        className="flex-1"
                        disabled={isLoading || otpCode.length !== 6}
                      >
                        {translations?.forms?.verifyAndSubmit || "Verify & Submit"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtpCode("");
                          setSessionId(null);
                        }}
                      >
                        {translations?.common?.back || "Back"}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            {!showOtpInput && (
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 md:flex-none"
                  disabled={
                    submissionMode === "guest"
                      ? isSendingOtp || isSubmittingLocal
                      : isLoading
                  }
                >
                  {submissionMode === "guest" ? (
                    isSendingOtp || isSubmittingLocal ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {translations?.forms?.sendingCode || "Sending Code..."}
                      </>
                    ) : (
                      translations?.forms?.submitAndSendVerification || "Submit & Send Verification"
                    )
                  ) : isLoading ? (
                    translations?.common?.loading || "Submitting..."
                  ) : (
                    translations?.forms?.submitComplaint || "Submit Complaint"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {translations?.forms?.resetForm || "Reset Form"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* OTP Dialog */}
      {showOtpDialog && (
        <OtpDialog
          open={showOtpDialog}
          onOpenChange={setShowOtpDialog}
          context="guestComplaint"
          email={formData.email}
          onVerified={async ({ otpCode }) => {
            if (!otpCode) return;
            await handleVerifyOtp(otpCode);
          }}
          onResend={async () => {
            try {
              await resendGuestOtp({ email: formData.email }).unwrap();
              toast({
                title: translations?.forms?.verificationCodeResent || "Verification Code Resent",
                description:
                  translations?.forms?.newVerificationCodeSent || "A new verification code has been sent to your email.",
              });
            } catch (error: any) {
              toast({
                title: translations?.forms?.failedToResend || "Failed to Resend",
                description:
                  error?.message || translations?.forms?.failedToResendVerificationCode || "Failed to resend verification code.",
                variant: "destructive",
              });
            }
          }}
          isVerifying={isVerifyingOtp}
        />
      )}

      {/* Location Map Dialog */}
      <SimpleLocationMapDialog
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
        {...(formData.coordinates && {
          initialLocation: {
            latitude: formData.coordinates.latitude,
            longitude: formData.coordinates.longitude,
            address: formData.address,
            area: formData.area,
            landmark: formData.location,
          },
        })}
      />
    </div>
  );
};

export default QuickComplaintForm;
