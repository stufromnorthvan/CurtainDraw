import { AuthContext } from '../App'
import React, {Navigate} from "react";
import './styles/home.css';
import { Link } from "react-router-dom";

export default function HomePage(props) {

  const token = React.useContext(AuthContext);

  return (
    <main className="main_page">
      <article className="sidebar">

      </article>
      <section className="main_section">
        <label className="title">CurtainDraw </label>
        <Link to="/canvas" className="new_canvas" style={{ color: 'rgb(50,50,50)', textDecoration: 'none' }}>Create New</Link>
        <div className="examples">
          <div className="ex1"></div>
          <div className="ex2"></div>
          <div className="ex3"></div>
          <div className="ex4"></div>
        </div>
      </section>
    </main>
  );
}