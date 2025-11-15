import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../components/InputField";
import axios from "axios";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const payload = {
        full_name: fullName,
        username: username,
        email: email,
        password: password,
      };

      console.log("Enviando:", payload);

      const response = await axios.post(
        "http://localhost:8000/api/v1/auth/register",
        payload
      );

      console.log("Registro exitoso:", response.data);

      alert("Usuario creado correctamente!");
      navigate("/"); 
    } catch (error) {
      console.error("Error al registrar:", error);

      if (error.response?.data?.detail) {
        alert("Error: " + error.response.data.detail);
      } else {
        alert("No se pudo registrar. Revisa el backend.");
      }
    }
  };

  return (
    <div className="card-container">
      <h1 className="title">Crear Cuenta</h1>
      <p className="subtitle">Regístrate en el Sistema SEIRV</p>

      <InputField
        label="Nombre Completo"
        type="text"
        placeholder="Ej: Juan Pérez"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <InputField
        label="Usuario"
        type="text"
        placeholder="ej: juanperez"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <InputField
        label="Email"
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <InputField
        label="Contraseña"
        type="password"
        placeholder="Mínimo 6 caracteres y una mayúscula"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleRegister}>Registrarse</button>

      <Link to="/" className="link">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </div>
  );
}
