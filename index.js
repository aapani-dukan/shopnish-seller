import { registerRootComponent } from 'expo';
import App from './App';

// Expo खुद ही app.json से नाम उठा लेगा और इसे "main" की तरह रजिस्टर कर देगा
registerRootComponent(App);