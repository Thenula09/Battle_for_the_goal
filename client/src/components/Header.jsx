import React from 'react'

export default function Header(){
  return (
    <header>
      <div>
        <h1 style={{margin:0,fontSize:'1.1rem'}}>Goal Counter</h1>
        <div style={{fontSize:'0.85rem',color:'#666'}}>Live scores</div>
      </div>
      <div>
        <small style={{color:'#666'}}>ESP32 & Node backend</small>
      </div>
    </header>
  )
}
