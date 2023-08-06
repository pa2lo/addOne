import './css/app.css'
import App from './App.svelte'

const app = new App({
  target: document.getElementById('app'),
})

export default app

if ("serviceWorker" in navigator) {
	navigator.serviceWorker.register('/sw.js');
}