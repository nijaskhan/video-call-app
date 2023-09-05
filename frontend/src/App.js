import React, { useEffect, useRef, useState } from 'react'
import './App.css';
import Peer from 'simple-peer';
import { io } from 'socket.io-client';

const socket = io.connect('http://localhost:9999');

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [name, setName] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [idToCall, setIdToCall] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        setStream(stream);
        console.log(myVideo.current);
        if (myVideo.current) myVideo.current.srcObject = stream;
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    socket.on('me', (id) => {
      setMe(id);
      console.log(`me ${id}`);
    });

    socket.on('call_user', (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

    // eslint-disable-next-line
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    });

    /* the "signal" event is triggered during the negotiation 
    process of establishing a WebRTC connection. It contains 
    critical information (ICE candidates and possibly SDP) that is 
    exchanged between peers to set up the connection successfully. */
    peer.on("signal", (data) => {
      socket.emit("call_user", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name
      });
    });

    /* the "stream" event is triggered when the 
    peer object receives a video or audio stream 
    from the remote peer. This event occurs as part of the 
    WebRTC peer connection process when the remote peer begins 
    sending its media stream. */
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream
    });

    socket.on("call_accepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  }

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    });

    peer.on("signal", (data) => {
      socket.emit("answer_call", { signal: data, to: caller });
    });

    // peer.on("stream", (stream) => {
    //   userVideo.current.srcObject = stream
    // });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  }

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  }

  return (
    <>
      <div className="App" style={{ display: 'flex', justifyContent: 'center' }}>
        <h1>Video call App</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{marginRight: '2rem'}}>         
            <video playsInline muted ref={myVideo} autoPlay style={{ width: '300px' }} />
        </div>
        <div style={{marginLeft: '2rem'}}>
          {
            callAccepted && !callEnded ?
              <video ref={userVideo} autoPlay playsInline style={{ width: '300px' }} />
              : null
          }
        </div>
      </div>

      <div style={{ margin: '5rem' }}>
        <div style={{ display: 'flex', paddingLeft: '1rem' }}>
          <label htmlFor="name">Name </label>
          <input id='name' type="text" value={name} onChange={(e) => setName(e.target.value)} />

          <label htmlFor="idToCall">idToCall </label>
          <input id='idToCall' type="text" value={idToCall} onChange={(e) => setIdToCall(e.target.value)} />
        </div>
        <div>
          <p>My_id : {me}</p>
        </div>

        <div>
          {
            callAccepted && !callEnded ? (
              <button onClick={leaveCall} >End Call</button>
            ) : (
              <button onClick={() => callUser(idToCall)}>Make Call</button>
            )
          }
          {idToCall}
        </div>
      </div>

      <div>
        {
          receivingCall && !callAccepted ? (
            <div>
              <h4>
                {name} is calling...
              </h4>
              <button onClick={answerCall} style={{
                backgroundColor: 'green'
              }}>Answer</button>
            </div>
          ) : (
            null
          )
        }
      </div>
    </>
  );
}

export default App;
