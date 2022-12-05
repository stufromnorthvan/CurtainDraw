import React, { useEffect, useState } from "react";
import Axios from "axios";

export default function UserImgs(props){

  const [drawings, setDrawings] = useState([]);

  const downloadImage = (dataUrl) => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = dataUrl;
    link.click();
  }

  useEffect(() => {
    (async () => {
      let res = await Axios.post('/api/user', {
        user_id: props.user.id
      })

      let rev = res.data.reverse();

      setDrawings(rev.map((drawing) => {
        let day = drawing.created_at.slice(0,10);
        let hourStr = drawing.created_at.slice(11,13);
        let minute = drawing.created_at.slice(14,16);
        let hourInt = parseInt(hourStr);
        hourInt -= 8;
        let time = 'AM';
        if(hourInt < 12){
          time = 'AM'
        } else if(hourInt === 12){
          time = 'PM'
        } else if(hourInt > 12){
          time = 'PM'
          hourInt -= 12;
        }

        return (
          <div className="account_images">
            <div className="img" id={drawing.id} key={drawing.id}>
              <img src={drawing.img_url} />
            </div>
            <div className="info">
              <label className="time">Created At: {`${day} ${hourInt}:${minute} ${time} PST`}</label>
              <i class="fa-solid fa-download" onClick={() => downloadImage(drawing.img_url)}></i>
            </div>
          
          </div>
          
        )
      }))
    })();
  }, []);

  return (
    <section className="user_images">
      <ul className="user_drawing_list">
        {drawings}
      </ul>
    </section>
  )
}