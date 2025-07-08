import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./supabaseClient";
import senacLogo from "./logo-senac.png";

const bgAnim = {
  position: "fixed",
  top: 0, left: 0, width: "100vw", height: "100vh",
  background: "linear-gradient(120deg,#141e30 0%,#17408c 50%,#f9b233 100%)",
  zIndex: -1,
  animation: "movebg 10s ease-in-out infinite alternate"
};

const atividadesMock = [
  { hora: "08:30", descricao: "Reunião de equipe" },
  { hora: "10:00", descricao: "Revisão de projetos" },
  { hora: "14:00", descricao: "Atendimento ao cliente" },
  { hora: "16:30", descricao: "Treinamento interno" }
];

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
  const [showScanner, setShowScanner] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [tipoPonto, setTipoPonto] = useState("");
  const [fade, setFade] = useState("in");
  const html5QrCodeRef = useRef(null);
  const timeoutRef = useRef(null);
  const agendaTimeoutRef = useRef(null);

  async function buscarAtividades(qrCodeMessage) {
    const usuarioId = qrCodeMessage.trim();
    // Data de hoje (YYYY-MM-DD)
    const hoje = new Date().toISOString().slice(0,10);
    // Busca agenda personalizada, se não tiver, usa mock
    let eventos = await buscarAgendaUsuario(usuarioId, hoje);
    if (!eventos.length) eventos = atividadesMock;
    setAtividades(eventos);

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

  function iniciarScanner() {
    setFade("out");
    setTimeout(() => {
      setShowScanner(true);
      setMensagem("");
      setAtividades([]);
      setTipoPonto("");
      setFade("in");
    }, 300);
  }

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
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            await destroyScanner();
            setShowScanner(false);
            setFade("in");
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

      timeoutRef.current = setTimeout(async () => {
        await destroyScanner();
        setShowScanner(false);
        setFade("in");
        setMensagem("Tempo esgotado. Por favor, tente novamente.");
      }, 10000);

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
    <>
      <style>{`
        @keyframes movebg {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .fade-in { animation: fadein .4s; opacity: 1; }
        .fade-out { animation: fadeout .3s; opacity: 0; pointer-events:none;}
        @keyframes fadein { from {opacity: 0;} to {opacity: 1;} }
        @keyframes fadeout { from {opacity: 1;} to {opacity: 0;} }
        body { background: #141e30; }
      `}</style>
      <div style={bgAnim}></div>
      <div
        className={fade === "in" ? "fade-in" : "fade-out"}
        style={{
          fontFamily: "'Inter', Arial, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 430,
            margin: "40px auto",
            padding: 30,
            borderRadius: 24,
            background: "rgba(25,30,45,0.92)",
            boxShadow: "0 8px 32px #0008, 0 2px 16px #17408c55",
            border: "1.5px solid #2e355c",
            position: "relative",
            backdropFilter: "blur(8px)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <img
              src={senacLogo}
              alt="Senac"
              style={{
                height: 48,
                filter: "drop-shadow(0 0 10px #f9b233cc) brightness(1.1)",
                marginBottom: 10
              }}
            />
          </div>
          <h2
            style={{
              textAlign: "center",
              marginBottom: 18,
              color: "#fff",
              fontWeight: 900,
              fontSize: "2.2rem",
              letterSpacing: ".07em",
              textShadow: "0 4px 16px #f9b23355,0 1px 2px #0008"
            }}
          >
            PointFlow
          </h2>
          <div
            style={{
              textAlign: "center",
              color: "#f9b233",
              fontWeight: 700,
              fontSize: "1.18em",
              letterSpacing: ".01em",
              marginBottom: showScanner ? 22 : 10,
              textShadow: "0 2px 6px #0004"
            }}
          >
            Controle de Ponto Inteligente Senac
          </div>

          {!showScanner && atividades.length === 0 && (
            <div style={{ transition: ".3s" }}>
              <button
                style={{
                  width: "100%",
                  padding: "17px 0",
                  borderRadius: 15,
                  border: "none",
                  background:
                    "linear-gradient(95deg,#17408c 0%,#304ffe 50%,#f9b233 100%)",
                  color: "#fff",
                  fontSize: "1.27em",
                  fontWeight: 800,
                  letterSpacing: ".02em",
                  cursor: "pointer",
                  marginBottom: 20,
                  boxShadow: "0 2px 16px #141e301c, 0 1px 8px #f9b23322",
                  transition: "filter .18s"
                }}
                onClick={iniciarScanner}
                onMouseDown={e => (e.target.style.filter = "brightness(0.9)")}
                onMouseUp={e => (e.target.style.filter = "brightness(1)")}
                onMouseLeave={e => (e.target.style.filter = "brightness(1)")}
              >
                Registrar Entrada/Saída
              </button>
              {mensagem && (
                <div
                  style={{
                    color: "#f9b233",
                    fontWeight: 600,
                    textAlign: "center",
                    fontSize: "1.15em",
                    marginTop: 15,
                    transition: ".2s"
                  }}
                >
                  {mensagem}
                </div>
              )}
            </div>
          )}

          {showScanner && (
            <div>
              <div
                id="reader"
                style={{
                  width: 290,
                  height: 290,
                  margin: "0 auto",
                  borderRadius: 16,
                  background: "#101624",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 16px #f9b23333, 0 0 0 4px #f9b23311"
                }}
              ></div>
              <div
                style={{
                  textAlign: "center",
                  marginTop: 20,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "1.09em",
                  letterSpacing: ".01em"
                }}
              >
                <span
                  style={{
                    background:
                      "linear-gradient(90deg,#f9b233 40%,#17408c 60%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent"
                  }}
                >
                  Aponte o QR Code do seu crachá
                </span>
                <div style={{
                  color: "#f9b233",
                  fontSize: "0.95em",
                  marginTop: 10,
                  opacity: 0.8,
                  fontWeight: 500
                }}>
                  (Você tem 10 segundos para leitura)
                </div>
              </div>
            </div>
          )}

          {atividades.length > 0 && (
            <div style={{ marginTop: 20, transition: ".4s" }}>
              <h3
                style={{
                  color: "#fff",
                  textAlign: "center",
                  marginBottom: 18,
                  fontWeight: 800,
                  letterSpacing: ".03em"
                }}
              >
                Atividades do Dia
              </h3>
              <div style={{ textAlign: "center", marginBottom: 8 }}>
                <span style={{
                  color: tipoPonto === "entrada" ? "#1cfc92" : "#fc5050",
                  fontWeight: 800,
                  fontSize: "1.23em",
                  textShadow: "0 2px 6px #0007"
                }}>
                  {tipoPonto === "entrada"
                    ? "Ponto registrado como ENTRADA"
                    : tipoPonto === "saida"
                    ? "Ponto registrado como SAÍDA"
                    : ""}
                </span>
              </div>
              <ul style={{ padding: 0, listStyle: "none", marginBottom: 0 }}>
                {atividades.map((a, i) => (
                  <li
                    key={i}
                    style={{
                      padding: "15px 10px",
                      marginBottom: 15,
                      borderRadius: 15,
                      background:
                        "linear-gradient(90deg,#19203a 70%,#f9b23322 100%)",
                      color: "#fff",
                      boxShadow: "0 2px 8px #17408c11, 0 1px 4px #f9b23311",
                      display: "flex",
                      alignItems: "center",
                      fontWeight: 600,
                      fontSize: "1.08em",
                      letterSpacing: ".01em"
                    }}
                  >
                    <span
                      style={{
                        minWidth: 70,
                        fontWeight: 900,
                        color: "#f9b233",
                        fontSize: "1.09em",
                        textShadow: "0 1px 2px #17408c44"
                      }}
                    >
                      {a.hora}
                    </span>
                    <span style={{ marginLeft: 14 }}>{a.descricao}</span>
                  </li>
                ))}
              </ul>
              <div
                style={{
                  color: "#f9b233",
                  textAlign: "center",
                  fontWeight: 500,
                  fontSize: "0.98em",
                  marginTop: 4,
                  opacity: 0.75
                }}
              >
                Esta agenda será fechada automaticamente em 15 segundos.
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "14px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "#1c2130",
                  color: "#f9b233",
                  fontWeight: 800,
                  fontSize: "1.08em",
                  cursor: "pointer",
                  marginTop: 16,
                  letterSpacing: ".01em",
                  boxShadow: "0 2px 10px #f9b23315",
                  transition: "background .15s, color .18s"
                }}
                onClick={backToMenu}
                onMouseDown={e => (e.target.style.background = "#f9b233")}
                onMouseDownCapture={e => (e.target.style.color = "#17408c")}
                onMouseUp={e => {
                  e.target.style.background = "#1c2130";
                  e.target.style.color = "#f9b233";
                }}
                onMouseLeave={e => {
                  e.target.style.background = "#1c2130";
                  e.target.style.color = "#f9b233";
                }}
              >
                Voltar agora
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PointFlow;
