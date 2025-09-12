import React, { useState } from "react";
import './modern.css';
import PointFlow from "./PointFlow";
import CadastroUsuario from "./CadastroUsuario";
import CadastroAgenda from "./CadastroAgenda";

function App() {
  const [tela, setTela] = useState("pointflow");
  const [screenState, setScreenState] = useState('in'); // 'in' | 'out'

  function navigateTo(next) {
    if (next === tela) return;
    setScreenState('out');
    setTimeout(() => {
      setTela(next);
      setScreenState('in');
    }, 220);
  }

  return (
    <div className="main-container">
      <div className="navbar card">
        <div className="brand"><img src={require('./logo-senac.png')} alt="Senac" /><h1>PointFlow</h1></div>
        <div className="nav-links">
          <button className="btn btn-ghost" onClick={() => navigateTo('pointflow')}>Registrar Ponto</button>
          <button className="btn btn-ghost" onClick={() => navigateTo('cadastro')}>Usuários</button>
          <button className="btn btn-ghost" onClick={() => navigateTo('agenda')}>Agenda</button>
        </div>
      </div>
      {tela === "pointflow" && (
        <div className={`page-wrapper ${screenState === 'in' ? 'fade-in' : 'fade-out'}`}>
          <div className="center-card">
            <PointFlow />
          </div>
        </div>
      )}
      {tela === "cadastro" && (
        <div className={`page-wrapper ${screenState === 'in' ? 'fade-in' : 'fade-out'}`}>
          <div className="center-card">
            <CadastroUsuario />
          </div>
        </div>
      )}
      {tela === "agenda" && (
        <div className={`page-wrapper ${screenState === 'in' ? 'fade-in' : 'fade-out'}`}>
          <div className="center-card">
            <CadastroAgenda />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
