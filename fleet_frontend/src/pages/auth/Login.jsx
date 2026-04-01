import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../../api/axios";
import { useStateContext } from "../../context/ContextProvider";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  
  // On récupère setUser ET setToken du contexte
  const { setUser, setToken } = useStateContext();
  
  const [errors, setErrors] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setErrors(null);
    setLoading(true);

    const payload = {
      email: emailRef.current.value,
      password: passwordRef.current.value,
    };

    try {
      /**
       * ÉTAPE 1 : Tentative de connexion
       * Note : Si ton axiosClient a déjà "/api" dans son baseURL, 
       * utilise juste "/login". Sinon, utilise "api/login".
       */
      const { data } = await axiosClient.post("/login", payload);
      
      /**
       * ÉTAPE 2 : Mise à jour du contexte et du localStorage
       * data doit contenir { user: {...}, token: "..." } renvoyé par Laravel
       */
      setUser(data.user);
      setToken(data.token);
      
      // La redirection se fera automatiquement via ton Router 
      // car le "token" ne sera plus nul dans le contexte.
      
    } catch (err) {
      const response = err.response;
      if (response && response.status === 422) {
        setErrors(response.data.errors);
      } else {
        setErrors({ main: ["Identifiants incorrects ou erreur serveur."] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <form onSubmit={onSubmit} className="space-y-6">
        {errors && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
            {Object.keys(errors).map((key) => (
              <p key={key} className="text-red-700 text-sm">
                {Array.isArray(errors[key]) ? errors[key][0] : errors[key]}
              </p>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <div className="mt-1 relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              ref={emailRef}
              type="email"
              placeholder="admin@cetic.dz"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cetic-blue focus:border-cetic-blue outline-none transition-all"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
          <div className="mt-1 relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              ref={passwordRef}
              type="password"
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cetic-blue focus:border-cetic-blue outline-none transition-all"
              required
            />
          </div>
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-cetic-blue hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-blue-300"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "Se connecter"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Besoin d'aide ? <Link to="/contact" className="text-cetic-blue hover:underline">Contacter le support</Link>
        </p>
      </form>
    </div>
  );
}