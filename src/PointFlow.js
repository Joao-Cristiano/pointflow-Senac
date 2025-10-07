import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./supabaseClient";
import senacLogo from "./logo-senac.png";

const bgAnim = {
  position: "fixed",
  top: 0, left: 0, width: "100vw", height: "100vh",
  zIndex: -1,
  animation: "movebg 10s ease-in-out infinite alternate"
};



// Alternância via LocalStorage
function getUltimoTipoLocal(usuario) {
  usuario = usuario.trim();
  return localStorage.getItem("ultimoTipo_" + usuario);
}

function setUltimoTipoLocal(usuario, tipo) {
  usuario = usuario.trim();
  localStorage.setItem("ultimoTipo_" + usuario, tipo);
}

// Salva registro de ponto
async function registrarPonto(usuario, tipo) {
  usuario = usuario.trim();
  const { error, data } = await supabase.from('registros').insert([
    { usuario, tipo, datahora: new Date().toISOString() }
  ]);
  if (error) {
    alert("Erro ao registrar ponto: " + error.message);
    console.log(error);
  } else {
    console.log("Registro salvo!", data);
  }
}

// Busca agenda personalizada do usuário para a data
async function buscarAgendaUsuario(usuarioId, data) {
  const { data: eventos, error } = await supabase
    .from("agenda")
    .select("hora, descricao")
    .eq("usuario_id", usuarioId)
    .eq("data", data)
    .order("hora", { ascending: true });
  if (error) {
    console.log("Erro ao buscar agenda:", error.message);
    return [];
  }
  return eventos || [];
}

function PointFlow() {
  const [atividades, setAtividades] = useState([]);
  const [showScanner, setShowScanner] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [tipoPonto, setTipoPonto] = useState("");
  const [fade, setFade] = useState("in");
  const html5QrCodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const lastScannedRef = useRef({ value: null, time: 0 });
  const agendaTimeoutRef = useRef(null);

  async function buscarAtividades(qrCodeMessage) {
    const usuarioId = qrCodeMessage.trim();
    // Data de hoje (YYYY-MM-DD)
    const hoje = new Date().toISOString().slice(0,10);

    // Busca agenda personalizada do usuário
    let eventos = await buscarAgendaUsuario(usuarioId, hoje);
    setAtividades(eventos);
    if (!eventos.length) {
      setMensagem("Nenhuma atividade cadastrada para hoje.");
    }

    // Alternância instantânea via LocalStorage
    let ultimoTipo = getUltimoTipoLocal(usuarioId);
    let proximoTipo = (ultimoTipo === "entrada") ? "saida" : "entrada";
    setUltimoTipoLocal(usuarioId, proximoTipo);

    setTipoPonto(proximoTipo);
    setMensagem(
      `Bem-vindo(a), ${usuarioId}! Seu registro foi marcado como "${proximoTipo.toUpperCase()}".`
    );
    await registrarPonto(usuarioId, proximoTipo);
  }

  // Scanner agora inicia automaticamente ao montar o componente.

  async function destroyScanner() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (html5QrCodeRef.current) {
      try { await html5QrCodeRef.current.stop(); } catch (e) {}
      try { await html5QrCodeRef.current.clear(); } catch (e) {}
      html5QrCodeRef.current = null;
    }
    const readerDiv = document.getElementById("reader");
    if (readerDiv) readerDiv.innerHTML = "";
  }

  useEffect(() => {
    if (showScanner) {
      html5QrCodeRef.current = new Html5Qrcode("reader");
      html5QrCodeRef.current
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 220 },
          async qrCodeMessage => {
            const now = Date.now();
            if (lastScannedRef.current.value === qrCodeMessage && (now - lastScannedRef.current.time) < 2000) {
              // ignore rapid duplicate reads
              return;
            }
            lastScannedRef.current = { value: qrCodeMessage, time: now };
            // keep scanner running; just process the code
            buscarAtividades(qrCodeMessage);
          },
          errorMessage => {}
        )
        .catch(async err => {
          setMensagem("Não foi possível acessar a câmera: " + err);
          await destroyScanner();
          setShowScanner(false);
          setFade("in");
        });

      return () => { destroyScanner(); };
    } else { destroyScanner(); }
    // eslint-disable-next-line
  }, [showScanner]);

  useEffect(() => {
    if (atividades.length > 0) {
      agendaTimeoutRef.current = setTimeout(() => {
        setFade("out");
        setTimeout(() => {
          setAtividades([]);
          setMensagem("");
          setTipoPonto("");
          setFade("in");
        }, 300);
      }, 15000);

      return () => {
        if (agendaTimeoutRef.current) {
          clearTimeout(agendaTimeoutRef.current);
          agendaTimeoutRef.current = null;
        }
      };
    }
  }, [atividades.length]);

  function backToMenu() {
    setFade("out");
    setTimeout(() => {
      setAtividades([]);
      setMensagem("");
      setTipoPonto("");
      setFade("in");
    }, 300);
  }

  return (
    <div className="main-container">
      <div style={bgAnim}></div>
  <div className={fade === "in" ? "fade-in" : "fade-out"} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card no-shadow" style={{ width: '100%', maxWidth: 640 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <img src={senacLogo} alt="Senac" style={{ height: 48, filter: 'drop-shadow(0 0 10px #f9b233cc) brightness(1.1)' }} />
          </div>
          <h2 style={{ textAlign: 'center', marginBottom: 10 }}>PointFlow</h2>
          <div style={{ textAlign: 'center', color: 'var(--senac-yellow)', fontWeight: 700, marginBottom: showScanner ? 20 : 8 }}>Controle de Ponto Inteligente Senac</div>

          {mensagem && !showScanner && atividades.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <div style={{ color: 'var(--senac-yellow)' }}>{mensagem}</div>
            </div>
          )}

          {showScanner && (
            <div style={{ textAlign: 'center' }}>
              <div id="reader" style={{ width: 300, height: 300, margin: '0 auto', borderRadius: 16, background: '#0b1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}></div>
              <div style={{ marginTop: 18, color: 'var(--text-muted)' }}>
                <div style={{ background: 'linear-gradient(90deg,var(--senac-yellow) 40%, var(--senac-blue) 60%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 700 }}>Aponte o QR Code do seu crachá</div>
                <div style={{ color: 'var(--senac-yellow)', marginTop: 8, opacity: 0.9 }}>(Você tem 10 segundos para leitura)</div>
              </div>
            </div>
          )}

          {atividades.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ textAlign: 'center', marginBottom: 12 }}>Atividades do Dia</h3>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <span style={{ color: tipoPonto === 'entrada' ? 'var(--accent)' : '#fc5050', fontWeight: 800 }}>{tipoPonto === 'entrada' ? 'Ponto registrado como ENTRADA' : tipoPonto === 'saida' ? 'Ponto registrado como SAÍDA' : ''}</span>
              </div>
              <ul className="activity-list">
                {atividades.map((a, i) => (
                  <li key={i} className="activity-item">
                    <div className="activity-time">{a.hora}</div>
                    <div>{a.descricao}</div>
                  </li>
                ))}
              </ul>
              <div style={{ color: 'var(--senac-yellow)', textAlign: 'center', marginTop: 8 }}>Esta agenda será fechada automaticamente em 15 segundos.</div>
              <button className="btn btn-ghost" style={{ marginTop: 14 }} onClick={backToMenu}>Voltar agora</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PointFlow;
