import { AuthContext } from '../App';
import React from "react";
import './styles/canvas.scss';
import "react-color-palette/lib/css/styles.css";
import Canvas from "../components/Canvas";
import Toolbar from "../components/Toolbar";
let canvasH = window.innerHeight - 200;
let canvasW = window.innerWidth - 400;

export default function CanvasPage() {

  const user = React.useContext(AuthContext);

  if (user) {
    return (
      <div>
        <div class="curtain">

          <div class="curtain__panel curtain__panel--left">
            <h1>Sav</h1>
          </div>

          <div class="curtain__content">
          </div>

          <div class="curtain__panel curtain__panel--right">
            <h1>ed!</h1>
          </div>

        </div>
        <Canvas
          height={canvasH}
          width={canvasW}
        />
      </div>
    );
  }
  return (

    <main className="main_page">
      <article className="sidebar">

      </article>
      <p>Please <a href="/login">Log in</a></p>
    </main>
  );
}