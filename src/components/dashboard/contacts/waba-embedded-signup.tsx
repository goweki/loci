"use client";

import { Button } from "@/components/ui/button";
import Loader from "@/components/ui/loaders";
import { toastWarn } from "@/components/ui/toast-warn";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID;
const META_EMBEDDED_CONFIG_ID = process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID;
const API_VERSION = "v22.0";

if (!META_APP_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_META_APP_ID");
}

if (!META_EMBEDDED_CONFIG_ID) {
  throw new Error("missing process.env.NEXT_PUBLIC_WABA_EMBEDDED_CONFIG_ID");
}

if (!API_VERSION) {
  throw new Error("missing process.env.API_VERSION");
}

interface FacebookProfile {
  name: string;
  email: string;
}

export default function FacebookLogin() {
  const [profile, setProfile] = useState<FacebookProfile | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window) return;
    if ((window as any).FB) {
      setSdkReady(true);
      return;
    }

    // Inject SDK script only once
    if (document.getElementById("facebook-jssdk")) return;

    const js = document.createElement("script");
    js.id = "facebook-jssdk";
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.onerror = () => toast.error("Failed to load Facebook SDK");
    document.body.appendChild(js);

    // Initialize the SDK when it loads
    (window as any).fbAsyncInit = () => {
      (window as any).FB.init({
        appId: META_APP_ID,
        xfbml: true,
        version: API_VERSION,
      });
      setSdkReady(true);
    };
  }, []);

  const handleLogin = () => {
    if (!sdkReady) {
      toast.error("Facebook SDK not ready");
      return;
    }

    setLoading(true);

    try {
      (window as any).FB.login(
        (response: any) => {
          console.log("FB.login response:", response);

          if (response.authResponse) {
            console.log("Welcome! Fetching your information...");

            (window as any).FB.api(
              "/me",
              { fields: "name,email" },
              (profileResponse: FacebookProfile) => {
                if (profileResponse) {
                  setProfile(profileResponse);
                } else {
                  toast.error("Failed to fetch profile information");
                }
                setLoading(false);
              }
            );
          } else {
            console.log("User cancelled login or did not fully authorize.");
            toastWarn("Meta authentication cancelled");
            setLoading(false);
          }
        },
        {
          config_id: META_EMBEDDED_CONFIG_ID,
          response_type: "code",
          override_default_response_type: true,
          extras: { setup: {} },
        }
      );
    } catch {
      toastWarn("META authentication failed, try again later");
    }
  };

  const handleLogout = () => {
    (window as any).FB.logout(() => {
      setProfile(null);
      console.log("User logged out");
    });
  };

  return (
    <div>
      {profile ? (
        <div>
          <p id="profile" className="mb-4">
            Meta Linkage <strong>{profile.name}</strong> - {profile.email}
          </p>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </div>
      ) : (
        <Button onClick={handleLogin} disabled={!sdkReady || loading}>
          {loading ? <Loader /> : "Integrate new Whatsapp Number"}
        </Button>
      )}
    </div>
  );
}
