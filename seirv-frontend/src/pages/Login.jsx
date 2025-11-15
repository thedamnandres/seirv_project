import { useState } from "react";
import { Link } from "react-router-dom";
import InputField from "../components/InputField";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");

  return (
    <div className="card-container">
      <h1 className="title">Iniciar Sesión</h1>
      <p className="subtitle">Bienvenido al Sistema SEIRV</p>

      <InputField
        label="Usuario o Email"
        type="text"
        placeholder="ej: jlopez / jlopez@mail.com"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
      />

      <InputField
        label="Contraseña"
        type="password"
        placeholder="Tu contraseña"
        value={clave}
        onChange={(e) => setClave(e.target.value)}
      />

      <button>Ingresar</button>

      <Link to="/register" className="link">¿No tienes cuenta? Crear una cuenta</Link>
    </div>
  );
}
