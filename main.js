const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');

let localStream;
let remoteStream;
let localPeerConnection;
let remotePeerConnection;

const iceServers = {
    iceServers: [
        { urls: 'stun:stun.stunprotocol.org' },
        { urls: 'turn:numb.viagenie.ca', credential: 'your-credential', username: 'your-username' },
    ],
};

startButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangupCall);

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        localPeerConnection = new RTCPeerConnection(iceServers);
        localStream.getTracks().forEach(track => localPeerConnection.addTrack(track, localStream));

        localPeerConnection.onicecandidate = e => {
            if (e.candidate) {
                remotePeerConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
            }
        };

        remotePeerConnection = new RTCPeerConnection(iceServers);
        remotePeerConnection.ontrack = e => {
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = e.streams[0];
            }
        };

        remotePeerConnection.onicecandidate = e => {
            if (e.candidate) {
                localPeerConnection.addIceCandidate(new RTCIceCandidate(e.candidate));
            }
        };

        localPeerConnection.createOffer()
            .then(offer => localPeerConnection.setLocalDescription(offer))
            .then(() => remotePeerConnection.setRemoteDescription(localPeerConnection.localDescription))
            .then(() => remotePeerConnection.createAnswer())
            .then(answer => remotePeerConnection.setLocalDescription(answer))
            .then(() => localPeerConnection.setRemoteDescription(remotePeerConnection.localDescription))
            .catch(error => console.error('Error when setting up the call:', error));
    } catch (error) {
        console.error('Error accessing media devices:', error);
    }
}

function hangupCall() {
    localPeerConnection.close();
    remotePeerConnection.close();
    localStream.getTracks().forEach(track => track.stop());
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}
