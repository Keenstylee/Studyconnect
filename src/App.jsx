import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { createSocket } from './socket.js';

const STORAGE_KEY = 'studyconnect_react_state';
const AUTH_KEY = 'studyconnect_auth_session';

const initialState = {
  user: {
    name: 'Keenscy Sanchez',
    career: 'Ingenieria de Sistemas',
    cycle: 'VI',
    university: 'Universidad Nacional',
    courses: ['Calculo II', 'Base de Datos', 'Redes'],
    availability: 'Lunes, Miercoles 6-9pm',
    bio: 'Estudiante de Ingenieria, me gusta el estudio colaborativo y los grupos organizados.',
  },
  joined: [],
  created: [],
  pendingRequests: [],
  requests: { sent: [], received: [] },
  msgcount: 0,
  notifications: [
    { id: 1, type: 'join_request', icon: '📨', title: 'Nueva solicitud', msg: 'Gorddy Vinces quiere unirse a tu grupo.', time: 'hace 5 min', read: false },
    { id: 2, type: 'accepted', icon: '✅', title: 'Solicitud aceptada', msg: 'Fuiste aceptado en el grupo Calculo II - Avanzado.', time: 'hace 1 hora', read: false },
    { id: 3, type: 'message', icon: '💬', title: 'Nuevo mensaje', msg: 'Munaya Euribe escribio en Base de Datos I.', time: 'hace 2 horas', read: false },
  ],
  groups: [
    {
      id: 1,
      name: 'Calculo II - Avanzado',
      course: 'Calculo II',
      desc: 'Integrales, series y ecuaciones diferenciales. Sesiones con pizarra digital compartida.',
      schedule: 'Martes y Jueves 7pm',
      max: 8,
      members: [2, 3],
      owner: 2,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      image: '/assets/group-math.png',
      msgs: [
        { uid: 2, name: 'Gorddy V.', text: 'Hola, practicamos derivadas hoy?', t: '18:30' },
        { uid: 3, name: 'Munaya E.', text: 'Si, subo los ejercicios al grupo ahora.', t: '18:32' },
      ],
    },
    {
      id: 2,
      name: 'Base de Datos I',
      course: 'Base de Datos',
      desc: 'Modelado ER, SQL avanzado y normalizacion. Apoyamos proyectos del ciclo.',
      schedule: 'Lunes 6pm',
      max: 6,
      members: [3, 4],
      owner: 3,
      uni: 'Universidad Nacional',
      mode: 'Hibrido',
      image: '/assets/group-database.png',
      msgs: [{ uid: 3, name: 'Munaya E.', text: 'Revisemos el modelo relacional del proyecto.', t: '17:10' }],
    },
    {
      id: 3,
      name: 'Redes y Protocolos',
      course: 'Redes',
      desc: 'TCP/IP, subneting y practica con Cisco Packet Tracer. Orientado a certificacion CCNA.',
      schedule: 'Miercoles 8pm',
      max: 5,
      members: [4],
      owner: 4,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      image: '/assets/group-network.png',
      msgs: [],
    },
    {
      id: 4,
      name: 'Programacion OOP',
      course: 'Programacion',
      desc: 'Java y Python orientado a objetos. Code reviews colaborativos y proyectos grupales.',
      schedule: 'Viernes 7pm',
      max: 10,
      members: [2, 3, 4],
      owner: 2,
      uni: 'Universidad de Lima',
      mode: 'Virtual',
      image: '/assets/group-database.png',
      msgs: [],
    },
    {
      id: 5,
      name: 'Calculo II - Integrales desde cero',
      course: 'Calculo II',
      desc: 'Grupo para repasar integrales definidas, tecnicas de integracion y ejercicios tipo examen.',
      schedule: 'Lunes y Miercoles 8pm',
      max: 12,
      members: [2, 6, 7, 8],
      owner: 6,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 6,
      name: 'Calculo II - Practica intensiva',
      course: 'Calculo II',
      desc: 'Resolucion rapida de problemas, limites, series y aplicaciones con apoyo entre miembros.',
      schedule: 'Sabados 9am',
      max: 6,
      members: [5, 7, 9, 10, 11],
      owner: 5,
      uni: 'Universidad Nacional',
      mode: 'Presencial',
      msgs: [],
    },
    {
      id: 7,
      name: 'SQL Lab - Consultas y joins',
      course: 'Base de Datos',
      desc: 'Practica de SELECT, JOIN, GROUP BY, subconsultas y consultas para proyectos academicos.',
      schedule: 'Martes 6pm',
      max: 10,
      members: [3, 8, 9],
      owner: 8,
      uni: 'Universidad Nacional',
      mode: 'Hibrido',
      msgs: [],
    },
    {
      id: 8,
      name: 'Modelado ER y normalizacion',
      course: 'Base de Datos',
      desc: 'Diseno de diagramas entidad-relacion, cardinalidades y normalizacion hasta 3FN.',
      schedule: 'Jueves 7pm',
      max: 8,
      members: [6, 10],
      owner: 10,
      uni: 'Universidad Tecnologica',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 9,
      name: 'PostgreSQL para proyectos',
      course: 'Base de Datos',
      desc: 'Enfoque practico en PostgreSQL, indices, restricciones, vistas y scripts de carga.',
      schedule: 'Domingos 5pm',
      max: 7,
      members: [4, 9, 12, 13, 14, 15],
      owner: 12,
      uni: 'Universidad de Lima',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 10,
      name: 'Redes - Subneting express',
      course: 'Redes',
      desc: 'Practica de subneting, VLSM, mascaras, rangos de IP y ejercicios cronometrados.',
      schedule: 'Viernes 8pm',
      max: 8,
      members: [5, 6, 7],
      owner: 7,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 11,
      name: 'Cisco Packet Tracer Club',
      course: 'Redes',
      desc: 'Laboratorios con routers, switches, VLANs, rutas estaticas y troubleshooting.',
      schedule: 'Sabados 4pm',
      max: 10,
      members: [8, 9, 10, 11],
      owner: 11,
      uni: 'Instituto Tecnologico',
      mode: 'Presencial',
      msgs: [],
    },
    {
      id: 12,
      name: 'Protocolos TCP/IP',
      course: 'Redes',
      desc: 'Repaso de capas, protocolos, puertos, DNS, DHCP y analisis de paquetes.',
      schedule: 'Miercoles 9pm',
      max: 6,
      members: [12, 13, 14, 15, 16],
      owner: 13,
      uni: 'Universidad Nacional',
      mode: 'Hibrido',
      msgs: [],
    },
    {
      id: 13,
      name: 'Programacion Java POO',
      course: 'Programacion',
      desc: 'Clases, objetos, herencia, interfaces, excepciones y pequenos retos de codigo.',
      schedule: 'Lunes 5pm',
      max: 12,
      members: [2, 4, 6],
      owner: 4,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 14,
      name: 'Python para ejercicios',
      course: 'Programacion',
      desc: 'Algoritmos, listas, diccionarios, funciones y ejercicios de practica semanal.',
      schedule: 'Martes 9pm',
      max: 9,
      members: [7, 8],
      owner: 8,
      uni: 'Universidad de Lima',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 15,
      name: 'Estructuras de Datos',
      course: 'Programacion',
      desc: 'Pilas, colas, listas, arboles y complejidad basica para evaluaciones.',
      schedule: 'Jueves 6pm',
      max: 8,
      members: [9, 10, 11, 12],
      owner: 9,
      uni: 'Universidad Tecnologica',
      mode: 'Hibrido',
      msgs: [],
    },
    {
      id: 16,
      name: 'Estadistica Aplicada',
      course: 'Estadistica',
      desc: 'Probabilidad, distribuciones, pruebas de hipotesis y ejercicios con datos reales.',
      schedule: 'Viernes 5pm',
      max: 7,
      members: [3, 5, 6],
      owner: 6,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 17,
      name: 'Algebra Lineal - Matrices',
      course: 'Algebra',
      desc: 'Matrices, determinantes, sistemas lineales, vectores y transformaciones.',
      schedule: 'Miercoles 4pm',
      max: 8,
      members: [2, 7, 13],
      owner: 13,
      uni: 'Universidad Nacional',
      mode: 'Presencial',
      msgs: [],
    },
    {
      id: 18,
      name: 'Arquitectura de Computadoras',
      course: 'Arquitectura',
      desc: 'Procesador, memoria, buses, ensamblador basico y organizacion interna.',
      schedule: 'Domingos 10am',
      max: 9,
      members: [4, 8],
      owner: 4,
      uni: 'Universidad Tecnologica',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 19,
      name: 'Ingenieria de Software',
      course: 'Ingenieria de Software',
      desc: 'Requisitos, casos de uso, historias de usuario, UML y gestion agil.',
      schedule: 'Lunes 9pm',
      max: 10,
      members: [5, 9, 14],
      owner: 14,
      uni: 'Universidad Nacional',
      mode: 'Hibrido',
      msgs: [],
    },
    {
      id: 20,
      name: 'Metodologias Agiles',
      course: 'Ingenieria de Software',
      desc: 'Scrum, Kanban, retrospectivas y organizacion de entregables del integrador.',
      schedule: 'Sabados 6pm',
      max: 12,
      members: [6, 7, 8, 9, 10],
      owner: 7,
      uni: 'Universidad de Lima',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 21,
      name: 'Sistemas Operativos',
      course: 'Sistemas Operativos',
      desc: 'Procesos, hilos, memoria, planificacion y comandos basicos de Linux.',
      schedule: 'Jueves 9pm',
      max: 8,
      members: [3, 4, 11],
      owner: 11,
      uni: 'Universidad Nacional',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 22,
      name: 'Investigacion Academica',
      course: 'Investigacion',
      desc: 'Redaccion, citas, metodologia, matriz de consistencia y revision de avances.',
      schedule: 'Martes 4pm',
      max: 6,
      members: [5, 12],
      owner: 12,
      uni: 'Universidad Nacional',
      mode: 'Presencial',
      msgs: [],
    },
    {
      id: 23,
      name: 'UX para proyectos web',
      course: 'Diseno UX',
      desc: 'Wireframes, heuristicas, prototipos y evaluacion rapida de interfaces.',
      schedule: 'Viernes 3pm',
      max: 10,
      members: [2, 6, 8, 14],
      owner: 8,
      uni: 'Universidad de Lima',
      mode: 'Virtual',
      msgs: [],
    },
    {
      id: 24,
      name: 'Seguridad Informatica Basica',
      course: 'Seguridad Informatica',
      desc: 'Buenas practicas, hashing, autenticacion, vulnerabilidades web y OWASP.',
      schedule: 'Domingos 7pm',
      max: 9,
      members: [4, 7, 10],
      owner: 10,
      uni: 'Universidad Tecnologica',
      mode: 'Hibrido',
      msgs: [],
    },
  ],
};

const nav = [
  { id: 'dashboard', icon: '⊞', label: 'Inicio', group: 'Principal' },
  { id: 'groups', icon: '◎', label: 'Explorar grupos', group: 'Principal' },
  { id: 'create', icon: '+', label: 'Crear grupo', group: 'Principal' },
  { id: 'matching', icon: '✦', label: 'Sugerencias', group: 'Actividad' },
  { id: 'requests', icon: '☑', label: 'Solicitudes', group: 'Actividad' },
  { id: 'chat', icon: '◈', label: 'Chat', group: 'Actividad' },
  { id: 'notifications', icon: '◉', label: 'Notificaciones', group: 'Actividad' },
  { id: 'profile', icon: '◇', label: 'Mi perfil', group: 'Cuenta' },
];

function loadState() {
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
  } catch {
    return initialState;
  }
}

function normalizeState(saved) {
  if (!saved || typeof saved !== 'object') return initialState;
  const savedGroups = Array.isArray(saved.groups) ? saved.groups : [];
  const seedGroups = initialState.groups.map((group) => ({
    ...group,
    ...(savedGroups.find((savedGroup) => savedGroup.id === group.id) || {}),
  }));
  const customGroups = savedGroups.filter((savedGroup) => !initialState.groups.some((group) => group.id === savedGroup.id));

  return {
    ...initialState,
    ...saved,
    user: { ...initialState.user, ...(saved.user || {}) },
    groups: [...seedGroups, ...customGroups],
    joined: Array.isArray(saved.joined) ? saved.joined : initialState.joined,
    created: Array.isArray(saved.created) ? saved.created : initialState.created,
    pendingRequests: Array.isArray(saved.pendingRequests) ? saved.pendingRequests : initialState.pendingRequests,
    requests: {
      sent: Array.isArray(saved.requests?.sent) ? saved.requests.sent : initialState.requests.sent,
      received: Array.isArray(saved.requests?.received) ? saved.requests.received : initialState.requests.received,
    },
    notifications: Array.isArray(saved.notifications) ? saved.notifications : initialState.notifications,
    msgcount: Number.isFinite(saved.msgcount) ? saved.msgcount : initialState.msgcount,
  };
}

function initials(name) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function courseColor(course) {
  const map = {
    'Calculo II': '#5d6cfa',
    'Base de Datos': '#3ecf8e',
    Redes: '#f0a429',
    Programacion: '#b06bfa',
    Estadistica: '#f55f5f',
    Algebra: '#fa5d8f',
    Arquitectura: '#38bdf8',
    'Ingenieria de Software': '#2dd4bf',
    'Sistemas Operativos': '#fb7185',
    Investigacion: '#c084fc',
    'Diseno UX': '#f97316',
    'Seguridad Informatica': '#22c55e',
  };
  return map[course] || '#8b8fa8';
}

function courseImage(course) {
  const normalized = String(course || '').toLowerCase();
  const pexels = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900&h=520&fit=crop`;
  if (normalized.includes('calculo') || normalized.includes('algebra')) return pexels('6256072');
  if (normalized.includes('base de datos')) return pexels('325229');
  if (normalized.includes('redes')) return pexels('2881233');
  if (normalized.includes('programacion')) return pexels('5926382');
  if (normalized.includes('estadistica')) return pexels('669615');
  if (normalized.includes('arquitectura') || normalized.includes('sistemas operativos')) return pexels('325229');
  if (normalized.includes('ingenieria de software')) return pexels('3861969');
  if (normalized.includes('investigacion')) return pexels('159711');
  if (normalized.includes('diseno ux')) return pexels('196644');
  if (normalized.includes('seguridad')) return pexels('5380659');
  return '/assets/course-default.png';
}

function App() {
  const [state, setState] = useState(loadState);
  const [auth, setAuth] = useState(() => {
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_KEY)) || null;
      return session?.token ? session : null;
    } catch {
      return null;
    }
  });
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState('');
  const [joinTarget, setJoinTarget] = useState(null);
  const [chatGroupId, setChatGroupId] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  const persist = (updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2500);
  };

  const setRemoteState = (nextState) => {
    setState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  useEffect(() => {
    if (!auth?.token) return;
    let active = true;
    setLoading(true);
    api.state(auth.token)
      .then((nextState) => {
        if (active) setRemoteState(nextState);
      })
      .catch((error) => showToast(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth?.token]);

  useEffect(() => {
    if (!auth?.token) return;
    const socket = createSocket();
    socketRef.current = socket;

    socket.on('message:new', () => {
      api.state(auth.token)
        .then(setRemoteState)
        .catch((error) => showToast(error.message));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [auth?.token]);

  const login = async ({ email, password }) => {
    try {
      setLoading(true);
      const data = await api.login({ email, password });
      localStorage.setItem(AUTH_KEY, JSON.stringify(data.session));
      setAuth(data.session);
      setRemoteState(data.state);
      showToast('Sesion iniciada correctamente');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password, career }) => {
    if (!name.trim() || !email.trim() || password.length < 6) {
      return { ok: false, message: 'Completa nombre, correo y una contrasena de minimo 6 caracteres.' };
    }
    try {
      setLoading(true);
      const data = await api.register({ name, email, password, career });
      localStorage.setItem(AUTH_KEY, JSON.stringify(data.session));
      setAuth(data.session);
      setRemoteState(data.state);
      showToast('Cuenta creada correctamente');
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
    setView('dashboard');
  };

  const isJoined = (id) => state.joined.includes(id);
  const isOwner = (id) => state.created.includes(id);
  const isRequested = (id) => (state.pendingRequests || []).includes(id);
  const memberCount = (group) => (group.members || []).length + (isJoined(group.id) || isOwner(group.id) ? 1 : 0);

  const myGroups = state.groups.filter((group) => isJoined(group.id) || isOwner(group.id));
  const activeChat = state.groups.find((group) => group.id === (chatGroupId || myGroups[0]?.id));
  const unread = state.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!socketRef.current || !myGroups.length) return;
    socketRef.current.emit('groups:join', myGroups.map((group) => group.id));
  }, [myGroups.map((group) => group.id).join(',')]);

  const go = (nextView) => {
    setView(nextView);
    if (nextView === 'chat' && !chatGroupId && myGroups.length) setChatGroupId(myGroups[0].id);
  };

  const openGroupChat = (groupId) => {
    setChatGroupId(groupId);
    setView('chat');
  };

  const joinGroup = async (message = '') => {
    if (!joinTarget) return;
    try {
      const nextState = await api.joinGroup(auth.token, joinTarget.id, message);
      setRemoteState(nextState);
      showToast(`Solicitud enviada a "${joinTarget.name}"`);
      setJoinTarget(null);
    } catch (error) {
      showToast(error.message);
    }
  };

  const answerJoinRequest = async (requestId, action) => {
    try {
      const nextState = await api.answerJoinRequest(auth.token, requestId, action);
      setRemoteState(nextState);
      showToast(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada');
    } catch (error) {
      showToast(error.message);
    }
  };
  const leaveGroup = async (id) => {
    try {
      const nextState = await api.leaveGroup(auth.token, id);
      setRemoteState(nextState);
      showToast('Saliste del grupo');
    } catch (error) {
      showToast(error.message);
    }
  };
  const createGroup = async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get('name') || '').trim();
    const course = String(form.get('course') || '').trim();
    if (!name || !course) {
      showToast('Completa al menos el nombre y el curso');
      return;
    }
    const group = {
      name,
      course,
      desc: String(form.get('desc') || '').trim() || 'Sin descripcion.',
      schedule: String(form.get('schedule') || '').trim() || 'Por coordinar',
      max: Number(form.get('max')) || 8,
      uni: String(form.get('uni') || '').trim() || 'Mi universidad',
      mode: String(form.get('mode') || 'Virtual'),
      image: '/assets/study-hero.png',
    };
    try {
      const nextState = await api.createGroup(auth.token, group);
      setRemoteState(nextState);
      formElement.reset();
      showToast(`Grupo "${name}" creado`);
      setView('groups');
    } catch (error) {
      showToast(error.message);
    }
  };
  const sendMessage = async (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.message;
    const text = input.value.trim();
    if (!text || !activeChat) return;
    try {
      const nextState = await api.sendMessage(auth.token, activeChat.id, text);
      setRemoteState(nextState);
      input.value = '';
    } catch (error) {
      showToast(error.message);
    }
  };
  const saveProfile = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const profile = {
      name: String(form.get('name') || '').trim(),
      career: String(form.get('career') || '').trim(),
      university: String(form.get('university') || '').trim(),
      availability: String(form.get('availability') || '').trim(),
      bio: String(form.get('bio') || '').trim(),
      cycle: String(form.get('cycle') || 'I'),
      courses: String(form.get('courses') || '').split(',').map((course) => course.trim()).filter(Boolean),
    };
    try {
      const nextState = await api.saveProfile(auth.token, profile);
      setRemoteState({ ...nextState, user: { ...nextState.user, availability: profile.availability } });
      showToast('Perfil actualizado correctamente');
    } catch (error) {
      showToast(error.message);
    }
  };
  if (!auth) {
    return <LoginPage login={login} register={register} loading={loading} />;
  }

  return (
    <div className="app">
      <Sidebar state={state} view={view} go={go} unread={unread} logout={logout} />
      <main className="main">
        {view === 'dashboard' && (
          <Dashboard state={state} memberCount={memberCount} isJoined={isJoined} isOwner={isOwner} isRequested={isRequested} setJoinTarget={setJoinTarget} openGroupChat={openGroupChat} go={go} />
        )}
        {view === 'groups' && (
          <Groups state={state} memberCount={memberCount} isJoined={isJoined} isOwner={isOwner} isRequested={isRequested} setJoinTarget={setJoinTarget} leaveGroup={leaveGroup} openGroupChat={openGroupChat} />
        )}
        {view === 'create' && <CreateGroup createGroup={createGroup} />}
        {view === 'matching' && (
          <Matching state={state} memberCount={memberCount} isJoined={isJoined} isOwner={isOwner} isRequested={isRequested} setJoinTarget={setJoinTarget} />
        )}
        {view === 'requests' && <Requests state={state} answerJoinRequest={answerJoinRequest} />}
        {view === 'chat' && (
          <Chat groups={myGroups} activeChat={activeChat} chatGroupId={chatGroupId} setChatGroupId={setChatGroupId} sendMessage={sendMessage} />
        )}
        {view === 'notifications' && <Notifications state={state} auth={auth} setRemoteState={setRemoteState} showToast={showToast} answerJoinRequest={answerJoinRequest} />}
        {view === 'profile' && <Profile user={state.user} saveProfile={saveProfile} />}
      </main>
      {joinTarget && <JoinModal group={joinTarget} joinGroup={joinGroup} close={() => setJoinTarget(null)} />}
      <div className={`toast ${toast ? 'show' : ''}`}><span className="toast-dot" /><span>{toast}</span></div>
    </div>
  );
}

function LoginPage({ login, register, loading }) {
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  const submitLogin = async (event) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const result = await login({
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
    });
    if (!result.ok) setError(result.message);
  };

  const submitRegister = async (event) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    const result = await register({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
      career: String(form.get('career') || ''),
    });
    if (!result.ok) setError(result.message);
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <section className="auth-visual">
          <div className="logo-mark auth-brand">
            <div className="logo-icon" aria-hidden="true">
              <span className="logo-node logo-node-a" />
              <span className="logo-node logo-node-b" />
              <span className="logo-node logo-node-c" />
              <span className="logo-book" />
            </div>
            <div>
              <div className="logo-text">StudyConnect</div>
              <div className="logo-sub">Aprende en equipo</div>
            </div>
          </div>
          <div className="auth-copy">
            <span className="hero-kicker">Plataforma academica</span>
            <h1>Conecta con grupos de estudio compatibles.</h1>
            <p>Explora cursos, recibe sugerencias, unete a equipos y conversa con tus companeros desde un solo lugar.</p>
          </div>
          <img className="auth-image" src="/assets/study-hero.png" alt="Vista visual de StudyConnect" />
        </section>

        <section className="auth-panel">
          <div className="auth-tabs">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Ingresar</button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(''); }}>Registrarse</button>
          </div>

          {mode === 'login' ? (
            <form className="auth-form" onSubmit={submitLogin} autoComplete="off">
              <div>
                <h2>Bienvenido de nuevo</h2>
                <p>Ingresa con la cuenta que registraste en StudyConnect.</p>
              </div>
              <Field label="Correo" name="email" type="email" placeholder="correo@universidad.edu" autoComplete="off" />
              <Field label="Contrasena" name="password" type="password" placeholder="Tu contrasena" autoComplete="new-password" />
              {error && <div className="auth-error">{error}</div>}
              <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Conectando...' : 'Iniciar sesion'}</button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={submitRegister} autoComplete="off">
              <div>
                <h2>Crear cuenta</h2>
                <p>Crea tu perfil para comenzar a estudiar en equipo.</p>
              </div>
              <Field label="Nombre completo" name="name" placeholder="Tu nombre" autoComplete="name" />
              <Field label="Correo" name="email" type="email" placeholder="correo@universidad.edu" autoComplete="email" />
              <Field label="Carrera" name="career" placeholder="Ej: Ingenieria de Sistemas" autoComplete="organization-title" />
              <Field label="Contrasena" name="password" type="password" placeholder="Minimo 6 caracteres" autoComplete="new-password" />
              {error && <div className="auth-error">{error}</div>}
              <button className="btn btn-primary btn-full" disabled={loading}>{loading ? 'Creando...' : 'Crear cuenta'}</button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

function Sidebar({ state, view, go, unread, logout }) {
  const sections = ['Principal', 'Actividad', 'Cuenta'];
  const [menuOpen, setMenuOpen] = useState(false);
  const goAndClose = (nextView) => {
    go(nextView);
    setMenuOpen(false);
  };

  return (
    <nav className={`sidebar ${menuOpen ? 'menu-open' : ''}`}>
      <div className="logo">
        <div className="logo-mark">
          <div className="logo-icon" aria-hidden="true">
            <span className="logo-node logo-node-a" />
            <span className="logo-node logo-node-b" />
            <span className="logo-node logo-node-c" />
            <span className="logo-book" />
          </div>
          <div>
            <div className="logo-text">StudyConnect</div>
            <div className="logo-sub">Aprende en equipo</div>
          </div>
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div className="nav">
        {sections.map((section) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            {nav.filter((item) => item.group === section).map((item) => (
              <button className={`nav-item ${view === item.id ? 'active' : ''}`} key={item.id} onClick={() => goAndClose(item.id)}>
                <span className="nav-icon">{item.icon}</span> {item.label}
                {item.id === 'notifications' && unread > 0 && <span className="nav-badge">{unread}</span>}
              </button>
            ))}
            {section === 'Cuenta' && (
              <button className="nav-item nav-item-danger" onClick={logout}>
                <span className="nav-icon">↩</span> Cerrar sesion
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="sidebar-user">
        <button className="user-chip" onClick={() => goAndClose('profile')}>
          <img className="avatar avatar-img" src="/assets/avatar-ks.png" alt="" />
          <div className="user-info">
            <div className="user-name">{state.user.name}</div>
            <div className="user-career">Ciclo {state.user.cycle}</div>
          </div>
        </button>
      </div>
    </nav>
  );
}

function Dashboard({ state, memberCount, isJoined, isOwner, isRequested, setJoinTarget, openGroupChat, go }) {
  const recs = state.groups.filter((group) => state.user.courses.includes(group.course) && !isJoined(group.id) && !isOwner(group.id)).slice(0, 4);
  return (
    <section className="view active dashboard-view">
      <div className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-kicker">Panel academico</span>
          <h1>Hola, <span>{state.user.name.split(' ')[0]}</span></h1>
          <p>Gestiona tus grupos, revisa sugerencias y vuelve rapido a las conversaciones que importan.</p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => go('matching')}>Ver sugerencias</button>
            <button className="btn btn-secondary" onClick={() => go('create')}>Crear grupo</button>
          </div>
        </div>
        <div className="hero-media">
          <img className="hero-image" src="/assets/study-hero.png" alt="Estudiantes conectados en StudyConnect" />
          <div className="session-popup">
            <span className="activity-dot" />
            <div>
              <strong>Hoy 7:00 PM</strong>
              <p>Calculo II - practica guiada</p>
            </div>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <Stat label="Grupos unidos" value={state.joined.length} sub="grupos activos" />
        <Stat label="Grupos creados" value={state.created.length} sub="como dueno" />
        <Stat label="Mensajes enviados" value={state.msgcount} sub="en todos los chats" />
      </div>
      <div className="dashboard-insights">
        <article className="insight-card">
          <span className="insight-icon">01</span>
          <div>
            <strong>Matching inteligente</strong>
            <p>Prioriza cursos en comun y cupos disponibles.</p>
          </div>
        </article>
        <article className="insight-card">
          <span className="insight-icon">02</span>
          <div>
            <strong>Ruta de estudio</strong>
            <p>Organiza tus grupos por curso, modalidad y horario.</p>
          </div>
        </article>
        <article className="insight-card">
          <span className="insight-icon">SQL</span>
          <div>
            <strong>Base de Datos</strong>
            <p>Revision de modelo relacional.</p>
          </div>
        </article>
        <article className="insight-card insight-card-strong">
          <span className="insight-icon">85%</span>
          <div>
            <strong>Compatibilidad alta</strong>
            <p>3 grupos recomendados para ti</p>
          </div>
        </article>
      </div>
      <div className="section-header">
        <span className="section-title">Grupos recomendados</span>
        <button className="section-link" onClick={() => go('matching')}>Ver todos →</button>
      </div>
      <div className="cards-grid">
        {recs.length ? recs.map((group) => <GroupCard key={group.id} group={group} memberCount={memberCount} joined={isJoined(group.id)} owner={isOwner(group.id)} requested={isRequested(group.id)} setJoinTarget={setJoinTarget} openGroupChat={openGroupChat} />) : <Empty icon="🔍" text="Agrega cursos en tu perfil para ver sugerencias" />}
      </div>
    </section>
  );
}

function Groups({ state, memberCount, isJoined, isOwner, isRequested, setJoinTarget, leaveGroup, openGroupChat }) {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [status, setStatus] = useState('');
  const courses = useMemo(() => [...new Set(state.groups.map((group) => group.course))], [state.groups]);
  const filtered = state.groups.filter((group) => {
    if (query && !`${group.name} ${group.course}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (course && group.course !== course) return false;
    if (status === 'open' && memberCount(group) >= group.max) return false;
    if (status === 'joined' && !isJoined(group.id) && !isOwner(group.id)) return false;
    return true;
  });
  return (
    <section className="view active">
      <Header title="Explorar grupos" sub="Encuentra companeros segun tu curso e intereses" />
      <div className="search-row">
        <div className="search-wrap"><span className="search-icon">🔎</span><input className="search-input" placeholder="Buscar por nombre o curso..." value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}><option value="">Todos los cursos</option>{courses.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Todos</option><option value="open">Con espacio</option><option value="joined">Unidos</option></select>
      </div>
      <div className="cards-grid">
        {filtered.length ? filtered.map((group) => <GroupCard key={group.id} group={group} memberCount={memberCount} joined={isJoined(group.id)} owner={isOwner(group.id)} requested={isRequested(group.id)} setJoinTarget={setJoinTarget} leaveGroup={leaveGroup} openGroupChat={openGroupChat} />) : <Empty icon="🔍" text="Sin resultados para tu busqueda" />}
      </div>
    </section>
  );
}

function GroupCard({ group, memberCount, joined, owner, requested, setJoinTarget, leaveGroup, openGroupChat }) {
  const cnt = memberCount(group);
  const color = courseColor(group.course);
  const full = cnt >= group.max;
  const canOpenChat = owner || joined;
  const handleCardClick = () => {
    if (canOpenChat) openGroupChat(group.id);
  };
  const handleLeave = (event) => {
    event.stopPropagation();
    leaveGroup(group.id);
  };
  return (
    <article
      className={`group-card ${canOpenChat ? 'group-card-chat' : ''}`}
      onClick={handleCardClick}
      role={canOpenChat ? 'button' : undefined}
      tabIndex={canOpenChat ? 0 : undefined}
      onKeyDown={(event) => {
        if (canOpenChat && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          handleCardClick();
        }
      }}
    >
      <div className="group-image-wrap">
        <img
          className="group-image"
          src={courseImage(group.course)}
          alt={`Imagen referente al curso ${group.course}`}
          onError={(event) => {
            event.currentTarget.src = '/assets/course-default.png';
          }}
        />
        <span className="group-mode">{group.mode}</span>
      </div>
      <span className="course-tag" style={{ background: `${color}22`, color }}>{group.course}</span>
      <div className="card-name">{group.name}</div>
      <div className="card-desc">{group.desc}</div>
      <div className="card-meta">🕐 {group.schedule}</div>
      <div className="card-meta">📍 {group.mode}</div>
      <div className="card-meta">👥 {cnt}/{group.max} integrantes</div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round((cnt / group.max) * 100)}%`, background: color }} /></div>
      {owner && <button className="btn btn-success btn-sm btn-full">Tu grupo</button>}
      {joined && <button className="btn btn-success btn-sm btn-full" onClick={handleLeave}>✓ Unido - Salir</button>}
      {requested && !owner && !joined && <button className="btn btn-secondary btn-sm btn-full" disabled>Solicitud enviada</button>}
      {!owner && !joined && full && <button className="btn btn-secondary btn-sm btn-full" disabled>Grupo lleno</button>}
      {!owner && !joined && !requested && !full && <button className="btn btn-secondary btn-sm btn-full" onClick={() => setJoinTarget(group)}>Solicitar unirse</button>}
    </article>
  );
}

function CreateGroup({ createGroup }) {
  return (
    <section className="view active">
      <Header title="Crear grupo de estudio" sub="Configura tu grupo y comienza a estudiar en equipo" />
      <form className="form-card" onSubmit={createGroup}>
        <Field label="Nombre del grupo" name="name" placeholder="Ej: Algebra Lineal - Avanzado" />
        <div className="form-row"><Field label="Curso" name="course" placeholder="Ej: Calculo II" /><Field label="Max. integrantes" name="max" type="number" defaultValue="8" /></div>
        <Field label="Descripcion" name="desc" textarea placeholder="En que se enfoca este grupo?" />
        <Field label="Horario" name="schedule" placeholder="Ej: Martes y Jueves 7-9pm" />
        <div className="form-row"><Field label="Universidad" name="uni" placeholder="Ej: Universidad Nacional" /><Select label="Modalidad" name="mode" options={['Virtual', 'Presencial', 'Hibrido']} /></div>
        <button className="btn btn-primary btn-full">+ Crear grupo</button>
      </form>
    </section>
  );
}

function Matching({ state, memberCount, isJoined, isOwner, isRequested, setJoinTarget }) {
  const courses = new Set(state.user.courses);
  const scored = state.groups
    .filter((group) => !isJoined(group.id) && !isOwner(group.id))
    .map((group) => ({ ...group, score: (courses.has(group.course) ? 5 : 0) + (memberCount(group) < group.max ? 2 : 0) + (memberCount(group) / group.max < 0.5 ? 1 : 0) }))
    .filter((group) => group.score > 0)
    .sort((a, b) => b.score - a.score);
  return (
    <section className="view active">
      <Header title="Sugerencias para ti ✦" sub="Grupos compatibles segun tus cursos y disponibilidad" />
      <div className="match-list">
        {scored.length ? scored.map((group) => {
          const color = courseColor(group.course);
          return (
            <article className="match-card" key={group.id}>
              <div className={`match-score ${group.score >= 6 ? 'score-high' : 'score-mid'}`}>{Math.round((group.score / 8) * 100)}%</div>
              <div className="match-info">
                <div className="match-name">{group.name}</div>
                <div className="match-meta">🕐 {group.schedule} · 👥 {memberCount(group)}/{group.max} · 📍 {group.mode}</div>
                <div className="match-tags"><span className="tag accent" style={{ background: `${color}22`, color, borderColor: `${color}33` }}>{group.course}</span><span className="tag green">✓ Compatible</span></div>
              </div>
              {isRequested(group.id) ? (
                <button className="btn btn-secondary btn-sm" disabled>Solicitud enviada</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => setJoinTarget(group)}>Solicitar</button>
              )}
            </article>
          );
        }) : <Empty icon="✦" text="Ya estas en todos los grupos compatibles con tus cursos" />}
      </div>
    </section>
  );
}

function Requests({ state, answerJoinRequest }) {
  const received = state.requests?.received || [];
  const sent = state.requests?.sent || [];
  const statusLabel = {
    pending: 'Pendiente',
    accepted: 'Aceptada',
    rejected: 'Rechazada',
  };

  return (
    <section className="view active">
      <Header title="Solicitudes" sub="Gestiona ingresos a tus grupos y revisa el estado de tus solicitudes" />
      <div className="requests-layout">
        <div className="requests-panel">
          <div className="section-header compact">
            <span className="section-title">Recibidas</span>
            <span className="tag">{received.length}</span>
          </div>
          <div className="match-list">
            {received.length ? received.map((request) => (
              <article className="match-card request-card" key={`received-${request.id}`}>
                <div className={`request-status status-${request.status}`}>{statusLabel[request.status] || request.status}</div>
                <div className="match-info">
                  <div className="match-name">{request.requesterName}</div>
                  <div className="match-meta">{request.requesterCareer || 'Estudiante'} · {request.groupName}</div>
                  <div className="match-tags">
                    <span className="tag accent">{request.course}</span>
                    {request.message && <span className="tag">{request.message}</span>}
                  </div>
                </div>
                {request.status === 'pending' && (
                  <div className="request-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => answerJoinRequest(request.id, 'accept')}>Aceptar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => answerJoinRequest(request.id, 'reject')}>Rechazar</button>
                  </div>
                )}
              </article>
            )) : <Empty icon="☑" text="No tienes solicitudes recibidas" />}
          </div>
        </div>

        <div className="requests-panel">
          <div className="section-header compact">
            <span className="section-title">Enviadas</span>
            <span className="tag">{sent.length}</span>
          </div>
          <div className="match-list">
            {sent.length ? sent.map((request) => (
              <article className="match-card request-card" key={`sent-${request.id}`}>
                <div className={`request-status status-${request.status}`}>{statusLabel[request.status] || request.status}</div>
                <div className="match-info">
                  <div className="match-name">{request.groupName}</div>
                  <div className="match-meta">{request.course} · {request.schedule}</div>
                  <div className="match-tags">
                    {request.message && <span className="tag">{request.message}</span>}
                  </div>
                </div>
              </article>
            )) : <Empty icon="☑" text="No has enviado solicitudes" />}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chat({ groups, activeChat, chatGroupId, setChatGroupId, sendMessage }) {
  return (
    <section className="view active">
      <Header title="Chat de grupos" sub="Mensajeria en tiempo real con tus companeros" />
      <div className="chat-layout">
        <div className="chat-sidebar">
          {groups.length ? groups.map((group) => <button className={`chat-item ${chatGroupId === group.id ? 'active' : ''}`} key={group.id} onClick={() => setChatGroupId(group.id)}><div className="chat-item-name">{group.name}</div><div className="chat-item-course">{group.course}</div><div className="chat-item-preview">{group.msgs[group.msgs.length - 1]?.text || 'Sin mensajes aun'}</div></button>) : <p className="card-desc">Unete a grupos para ver el chat aqui.</p>}
        </div>
        <div className="chat-window">
          <div className="chat-header"><div><div className="chat-header-name">{activeChat?.name || 'Selecciona un grupo'}</div><div className="chat-header-course">{activeChat ? `${activeChat.course} · ${activeChat.mode}` : '-'}</div></div>{activeChat && <div className="online-dot" />}</div>
          <div className="chat-msgs">
            {activeChat?.msgs.length ? activeChat.msgs.map((msg, index) => <div className={`msg-group ${msg.uid === 1 ? 'mine' : 'other'}`} key={`${msg.t}-${index}`}>{msg.uid !== 1 && <div className="msg-sender">{msg.name}</div>}<div className="msg-bubble">{msg.text}</div></div>) : <Empty icon="💬" text="Se el primero en escribir algo" />}
          </div>
          <form className="chat-compose" onSubmit={sendMessage}><input className="chat-input" name="message" placeholder="Escribe un mensaje..." disabled={!activeChat} /><button className="chat-send" disabled={!activeChat}>➤</button></form>
        </div>
      </div>
    </section>
  );
}

function Notifications({ state, auth, setRemoteState, showToast, answerJoinRequest }) {
  const markAllRead = async () => {
    try {
      const nextState = await api.markNotificationsRead(auth.token);
      setRemoteState(nextState);
      showToast('Notificaciones marcadas como leidas');
    } catch (error) {
      showToast(error.message);
    }
  };
  return (
    <section className="view active">
      <Header title="Notificaciones" sub="Actividad reciente en tus grupos" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}><button className="btn btn-secondary btn-sm" onClick={markAllRead}>Marcar todo como leido</button></div>
      <div className="notif-list">
        {state.notifications.length ? state.notifications.map((n) => {
          const requestId = n.data?.requestId;
          const pending = n.type === 'join_request' && requestId && (n.data?.status || 'pending') === 'pending';
          return (
            <article className={`notif-item ${n.read ? '' : 'unread'}`} key={n.id}>
              <span className="notif-icon">{n.icon}</span>
              <div>
                <div className="notif-title">{n.title}</div>
                <div className="notif-msg">{n.msg}</div>
                <div className="notif-time">{n.time}</div>
                {pending && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => answerJoinRequest(requestId, 'accept')}>Aceptar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => answerJoinRequest(requestId, 'reject')}>Rechazar</button>
                  </div>
                )}
              </div>
            </article>
          );
        }) : <Empty icon="🔔" text="Sin notificaciones por ahora" />}
      </div>
    </section>
  );
}

function Profile({ user, saveProfile }) {
  return (
    <section className="view active">
      <Header title="Mi perfil academico" sub="Manten tu informacion actualizada para mejores sugerencias" />
      <div className="profile-header"><img className="profile-avatar profile-avatar-img" src="/assets/avatar-ks.png" alt="" /><div><div className="profile-name">{user.name}</div><div className="profile-career">{user.career} - {user.university} · Ciclo {user.cycle}</div><div className="profile-tags">{user.courses.map((course) => <span className="tag" key={course}>{course}</span>)}</div></div></div>
      <form className="form-card" onSubmit={saveProfile}>
        <div className="form-row"><Field label="Nombre completo" name="name" defaultValue={user.name} /><Select label="Ciclo academico" name="cycle" options={['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']} defaultValue={user.cycle} /></div>
        <div className="form-row"><Field label="Carrera" name="career" defaultValue={user.career} /><Field label="Universidad" name="university" defaultValue={user.university} /></div>
        <Field label="Mis cursos (separados por coma)" name="courses" defaultValue={user.courses.join(', ')} />
        <Field label="Disponibilidad horaria" name="availability" defaultValue={user.availability} />
        <Field label="Bio / descripcion breve" name="bio" textarea defaultValue={user.bio} />
        <button className="btn btn-primary">Guardar cambios</button>
      </form>
    </section>
  );
}

function JoinModal({ group, joinGroup, close }) {
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    joinGroup(String(form.get('message') || '').trim());
  };

  return (
    <div className="modal-overlay open" onClick={close}>
      <form className="modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <div className="modal-title">Unirse a "{group.name}"</div>
        <div className="modal-sub">{group.course} · {group.schedule}</div>
        <div className="form-group"><label className="form-label">Mensaje (opcional)</label><textarea className="form-textarea" name="message" placeholder="Por que quieres unirte a este grupo?" /></div>
        <div className="modal-actions"><button className="btn btn-secondary" type="button" onClick={close}>Cancelar</button><button className="btn btn-primary">Enviar solicitud</button></div>
      </form>
    </div>
  );
}

function Header({ title, sub }) {
  return <div className="view-header"><h1 className="view-title">{title}</h1><p className="view-sub">{sub}</p></div>;
}

function Stat({ label, value, sub }) {
  return <article className="stat-card"><div className="stat-label">{label}</div><div className="stat-num">{value}</div><div className="stat-sub">{sub}</div></article>;
}

function Empty({ icon, text }) {
  return <div className="empty" style={{ gridColumn: '1 / -1' }}><span className="empty-icon">{icon}</span>{text}</div>;
}

function Field({ label, name, textarea, type = 'text', ...props }) {
  return <div className="form-group"><label className="form-label">{label}</label>{textarea ? <textarea className="form-textarea" name={name} {...props} /> : <input className="form-input" type={type} name={name} {...props} />}</div>;
}

function Select({ label, name, options, defaultValue }) {
  return <div className="form-group"><label className="form-label">{label}</label><select className="form-select" name={name} defaultValue={defaultValue}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
}

export default App;

