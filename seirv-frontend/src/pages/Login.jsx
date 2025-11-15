import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const payload = {
        username: username,
        password: password,
      };

      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/login",
        payload
      );

      const token = response.data.access_token;

      // Guardar token
      localStorage.setItem("token", token);

      // Redirigir al dashboard
      navigate("/dashboard");

    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      alert("Credenciales incorrectas");
    }
  };

  return (
    <div className="card-container">
      <h1 className="title">Iniciar Sesión</h1>
      <p className="subtitle">Bienvenido al Sistema SEIRV</p>

      <InputField
        label="Usuario"
        type="text"
        placeholder="tu usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <InputField
        label="Contraseña"
        type="password"
        placeholder="tu contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Ingresar</button>

      <Link to="/register" className="link">¿No tienes cuenta? Crear una cuenta</Link>
    </div>
  );
}
