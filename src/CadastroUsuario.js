import React, { useState } from "react";
import { supabase } from "./supabaseClient";

function gerarIdUsuario() {
  // Gera uma string de 10 dígitos aleatórios (não começa com zero)
  let id = Math.floor(Math.random() * 9 + 1).toString();
  while (id.length < 10) id += Math.floor(Math.random() * 10).toString();
  return id;
}

function CadastroUsuario() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [idUsuario, setIdUsuario] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function cadastrar(e) {
    e.preventDefault();
    const novoId = gerarIdUsuario();
    const { error } = await supabase.from("usuarios").insert([
      { id: novoId, nome, email }
    ]);
    if (error) {
      setMensagem("Erro ao cadastrar: " + error.message);
      setIdUsuario("");
    } else {
      setMensagem("Usuário cadastrado com sucesso! ID: " + novoId);
      setIdUsuario(novoId);
      setNome(""); setEmail("");
    }
  }

  return (
    <form onSubmit={cadastrar} style={{ maxWidth: 400, margin: "24px auto", padding: 20, borderRadius: 10, background: "#23293a" }}>
      <h3 style={{ color: "#fff" }}>Cadastro de Usuário</h3>
      <input type="text" placeholder="Nome" value={nome} onChange={e => setNome(e.target.value)} required style={{ width: "100%", marginBottom: 8 }} />
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", marginBottom: 8 }} />
      <button type="submit" style={{ width: "100%", padding: 8, background: "#17408c", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Cadastrar</button>
      {idUsuario && (
        <div style={{ marginTop: 16, color: "#1cfc92", fontWeight: 700 }}>
          <div>ID do usuário: <span style={{ fontFamily: "monospace", fontSize: "1.2em" }}>{idUsuario}</span></div>
          <div style={{ color: "#f9b233", fontSize: "0.9em" }}>Este ID deve ser transformado em QR Code para o crachá!</div>
        </div>
      )}
      <div style={{ color: "#f9b233", marginTop: 8 }}>{mensagem}</div>
    </form>
  );
}

export default CadastroUsuario;
