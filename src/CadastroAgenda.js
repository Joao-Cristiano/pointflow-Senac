import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function CadastroAgenda() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [descricao, setDescricao] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function fetchUsuarios() {
      const { data } = await supabase.from("usuarios").select("id, nome").order("nome");
      setUsuarios(data || []);
    }
    fetchUsuarios();
  }, []);

  async function cadastrar(e) {
    e.preventDefault();
    const { error } = await supabase.from("agenda").insert([
      { usuario_id: usuarioId, data, hora, descricao }
    ]);
    if (error) setMensagem("Erro ao cadastrar: " + error.message);
    else {
      setMensagem("Evento cadastrado!");
      setData(""); setHora(""); setDescricao("");
    }
  }

  return (
    <form onSubmit={cadastrar} style={{ maxWidth: 400, margin: "24px auto", padding: 20, borderRadius: 10, background: "#23293a" }}>
      <h3 style={{ color: "#fff" }}>Adicionar Evento na Agenda</h3>
      <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required style={{ width: "100%", marginBottom: 8 }}>
        <option value="">Selecione o usuário</option>
        {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome} ({u.id})</option>)}
      </select>
      <input type="date" value={data} onChange={e => setData(e.target.value)} required style={{ width: "100%", marginBottom: 8 }} />
      <input type="time" value={hora} onChange={e => setHora(e.target.value)} required style={{ width: "100%", marginBottom: 8 }} />
      <input type="text" placeholder="Descrição" value={descricao} onChange={e => setDescricao(e.target.value)} required style={{ width: "100%", marginBottom: 8 }} />
      <button type="submit" style={{ width: "100%", padding: 8, background: "#17408c", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700 }}>Cadastrar Evento</button>
      <div style={{ color: "#f9b233", marginTop: 8 }}>{mensagem}</div>
    </form>
  );
}

export default CadastroAgenda;
