import { useFrappeAuth } from "frappe-react-sdk";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export const Login = () => {
  const { login } = useFrappeAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const passwordInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const loginTimeoutRef = useRef(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      await login({
        username: email,
        password: password,
      });
      navigate("/jobcards");
    } catch (error) {
      console.error("Login failed", error);
      toast.error('Kullanıcı Adı veya Şifre Hatalı')
    }
  };

  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (e.target.value.length > 0) {
      // Small delay to ensure barcode is fully read
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  };

  // Handle password input change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    
    // Clear any existing timeout
    if (loginTimeoutRef.current) {
      clearTimeout(loginTimeoutRef.current);
    }

    // Set new timeout for login
    loginTimeoutRef.current = setTimeout(() => {
      if (e.target.value.length > 0) {
        handleSubmit();
      }
    }, 500); // Wait for 500ms after last character
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loginTimeoutRef.current) {
        clearTimeout(loginTimeoutRef.current);
      }
    };
  }, []);

  // Focus email input on component mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-sky-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center">
              <img src="/files/logobg.jpg" className="w-24 h-24"/>
            </div>
            
            {/* <h1 className="text-2xl font-semibold">Giriş</h1> */}
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="text"
                    ref={emailInputRef}
                    className="placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                    placeholder="Email address"
                    onChange={handleEmailChange}
                    value={email}
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                  >
                    Kullanıcı Adı
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    ref={passwordInputRef}
                    className="placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-rose-600"
                    placeholder="Password"
                    onChange={handlePasswordChange}
                    value={password}
                  />
                  <label
                    htmlFor="password"
                    className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                  >
                    Şifre
                  </label>
                </div>
                <div onClick={handleSubmit} className="relative bg-slate-200 py-1 rounded-md hover:bg-slate-300 cursor-pointer">
                  <button>Giriş</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


