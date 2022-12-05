import { AuthContext } from '../App'
import React from "react";
import './styles/account.css'
import Axios from 'axios';
import UserImgs from '../components/userimgs';
import { useEffect, useState } from 'react';

export default function AccountPage(props) {

  const user = React.useContext(AuthContext);
  const [totdrawings, settotDrawings] = useState(0);

  useEffect(() => {
    {user && (async () => {
      let res = await Axios.post('/api/user', {
        user_id: user.id
      })
      settotDrawings(res.data.length)
    })();
  }}, []);

  
  return(
    <main className="main_page">

      {!user && <p>Please <a href="/login">Log in</a></p>}
      {user && <section className="main_section">
      
        <section className="user">
          <img src={user.avatar_url}/>
          <div className="user_info">
            <label className="user_name">{user.name}</label>
            <label className='desc'>{user.bio}</label>
            <label className="location">{user.location}</label>
            <label className="total_projects">Total Projects: {totdrawings}</label>
          </div>
        </section>
        <UserImgs
          user={user}
        />
      </section>}
    </main>
  )
}