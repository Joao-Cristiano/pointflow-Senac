import React, { useState } from "react";
import PointFlow from "./PointFlow";
import CadastroUsuario from "./CadastroUsuario";
import CadastroAgenda from "./CadastroAgenda";

function App() {
  const [tela, setTela] = useState("inicio");

  return (
    <div>
      {tela === "inicio" && (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#141e30" }}>
          <div style={{
            background: "rgba(30,34,56,0.98)", padding: 32, borderRadius: 18, boxShadow: "0 8px 24px #0007",
            width: 320, display: "flex", flexDirection: "column", gap: 18, alignItems: "center"
          }}>
            <h2 style={{ color: "#fff", marginBottom: 12, fontWeight: 800 }}>Menu PointFlow</h2>
            <button
              onClick={() => setTela("pointflow")}
              style={{ width: "100%", padding: 12, background: "#17408c", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "1em", cursor: "pointer" }}
            >Registrar Entrada/Saída</button>
            <button
              onClick={() => setTela("cadastro")}
              style={{ width: "100%", padding: 12, background: "#1cfc92", color: "#17408c", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "1em", cursor: "pointer" }}
            >Cadastro de Usuário</button>
            <button
              onClick={() => setTela("agenda")}
              style={{ width: "100%", padding: 12, background: "#f9b233", color: "#23293a", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "1em", cursor: "pointer" }}
            >Cadastro de Agenda</button>
          </div>
        </div>
      )}
      {tela === "pointflow" && (
        <div>
          <button onClick={() => setTela("inicio")} style={{ margin: 18, position: "absolute", left: 0, top: 0, padding: 7, background: "#23293a", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, zIndex: 2 }}>← Voltar ao Menu</button>
          <PointFlow />
        </div>
      )}
      {tela === "cadastro" && (
        <div>
          <button onClick={() => setTela("inicio")} style={{ margin: 18, position: "absolute", left: 0, top: 0, padding: 7, background: "#23293a", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, zIndex: 2 }}>← Voltar ao Menu</button>
          <CadastroUsuario />
        </div>
      )}
      {tela === "agenda" && (
        <div>
          <button onClick={() => setTela("inicio")} style={{ margin: 18, position: "absolute", left: 0, top: 0, padding: 7, background: "#23293a", color: "#fff", border: "none", borderRadius: 7, fontWeight: 700, zIndex: 2 }}>← Voltar ao Menu</button>
          <CadastroAgenda />
        </div>
      )}
    </div>
  );
}

export default App;
