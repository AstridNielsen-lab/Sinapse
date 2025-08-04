// Neural Synapse 3D Simulation
class NeuralSimulation {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.neurons = [];
        this.synapses = [];
        this.neurotransmitters = [];
        this.actionPotentials = [];
        this.ionChannels = [];
        this.vesicles = [];
        
        this.isPlaying = false;
        this.labelsVisible = true;
        this.currentStep = 0;
        this.time = 0;
        this.loopCount = 0;
        this.maxLoops = 3; // Limitar a 3 ciclos
        
        this.cameraTargets = {
            overview: { position: [0, 5, 15], target: [0, 0, 0] },
            synapse: { position: [2, 1, 8], target: [2, 0, 0] },
            axon: { position: [-5, 2, 10], target: [-5, 0, 0] }
        };
        
        this.currentCameraTarget = 'overview';
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.createNeurons();
        this.createSynapses();
        this.createEnvironment();
        this.setupControls();
        this.setupLighting();
        this.animate();
        
        document.getElementById('loading').style.display = 'none';
    }
    
    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a1a);
        this.scene.fog = new THREE.Fog(0x0a0a1a, 20, 100);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 15);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // Add mouse controls for camera
        this.setupMouseControls();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupLighting() {
        // Ambient light for basic illumination
        const ambientLight = new THREE.AmbientLight(0x1a1a3a, 0.4);
        this.scene.add(ambientLight);
        
        // Main directional light
        const mainLight = new THREE.DirectionalLight(0x4488ff, 0.8);
        mainLight.position.set(10, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        this.scene.add(mainLight);
        
        // Rim light for neural glow
        const rimLight = new THREE.DirectionalLight(0x00ffaa, 0.3);
        rimLight.position.set(-5, 5, -5);
        this.scene.add(rimLight);
        
        // Point lights for bioluminescence
        const bioLight1 = new THREE.PointLight(0x00ff88, 0.6, 20);
        bioLight1.position.set(0, 3, 0);
        this.scene.add(bioLight1);
        
        const bioLight2 = new THREE.PointLight(0xff4488, 0.4, 15);
        bioLight2.position.set(5, 1, 5);
        this.scene.add(bioLight2);
    }
    
    createNeurons() {
        // Create presynaptic neuron
        const presynapticNeuron = this.createNeuron({
            position: [-8, 0, 0],
            type: 'presynaptic',
            color: 0x4488ff
        });
        this.neurons.push(presynapticNeuron);
        
        // Create postsynaptic neuron
        const postsynapticNeuron = this.createNeuron({
            position: [8, 0, 0],
            type: 'postsynaptic',
            color: 0x88ff44
        });
        this.neurons.push(postsynapticNeuron);
        
        // Create additional neurons for network effect
        for (let i = 0; i < 3; i++) {
            const neuron = this.createNeuron({
                position: [
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 10
                ],
                type: 'interneuron',
                color: 0xaa66ff
            });
            this.neurons.push(neuron);
        }
    }
    
    createNeuron(config) {
        const neuronGroup = new THREE.Group();
        
        // Cell body (soma)
        const somaGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const somaMaterial = new THREE.MeshPhysicalMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.3, // Muito mais transparente
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.7, // Mais transmissão
            thickness: 0.2, // Mais fino
            wireframe: false // Manter sólido para o soma
        });
        const soma = new THREE.Mesh(somaGeometry, somaMaterial);
        soma.castShadow = true;
        soma.receiveShadow = true;
        neuronGroup.add(soma);
        
        // Nucleus
        const nucleusGeometry = new THREE.SphereGeometry(0.6, 16, 16);
        const nucleusMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15, // Mais transparente
            emissive: 0x222244,
            emissiveIntensity: 0.1, // Menos emissão
            wireframe: true // Wireframe para leveza
        });
        const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        neuronGroup.add(nucleus);
        
        // Axon
        const axonPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(2, 0.5, 0),
            new THREE.Vector3(4, -0.2, 0.3),
            new THREE.Vector3(6, 0.3, -0.2),
            new THREE.Vector3(8, 0, 0)
        ]);
        
        const axonGeometry = new THREE.TubeGeometry(axonPath, 50, 0.2, 8, false);
        const axonMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x66aaff,
            transparent: true,
            opacity: 0.4, // Mais transparente
            roughness: 0.2,
            metalness: 0.1,
            wireframe: true // Wireframe para leveza
        });
        const axon = new THREE.Mesh(axonGeometry, axonMaterial);
        axon.castShadow = true;
        neuronGroup.add(axon);
        
        // Dendrites
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dendritePath = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(
                    Math.cos(angle) * 2,
                    Math.sin(angle) * 2 + Math.random() * 0.5,
                    (Math.random() - 0.5) * 1
                ),
                new THREE.Vector3(
                    Math.cos(angle) * 3.5,
                    Math.sin(angle) * 3.5 + Math.random() * 0.8,
                    (Math.random() - 0.5) * 2
                )
            ]);
            
            const dendriteGeometry = new THREE.TubeGeometry(dendritePath, 20, 0.05, 6, false);
            const dendriteMaterial = new THREE.MeshPhysicalMaterial({
                color: config.color,
                transparent: true,
                opacity: 0.3, // Mais transparente
                roughness: 0.3,
                wireframe: true // Wireframe para leveza
            });
            const dendrite = new THREE.Mesh(dendriteGeometry, dendriteMaterial);
            neuronGroup.add(dendrite);
        }
        
        neuronGroup.position.set(...config.position);
        neuronGroup.userData = { type: config.type, axonPath: axonPath };
        this.scene.add(neuronGroup);
        
        return neuronGroup;
    }
    
    createSynapses() {
        // Main synapse between first two neurons
        const synapse = this.createSynapse({
            presynaptic: this.neurons[0],
            postsynaptic: this.neurons[1],
            position: [0, 0, 0]
        });
        this.synapses.push(synapse);
        
        // Create synaptic vesicles
        this.createSynapticVesicles(synapse);
        
        // Create ion channels
        this.createIonChannels(synapse);
        
        // Create receptors
        this.createReceptors(synapse);
    }
    
    createSynapse(config) {
        const synapseGroup = new THREE.Group();
        
        // Synaptic cleft
        const cleftGeometry = new THREE.BoxGeometry(0.5, 2, 2);
        const cleftMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x2244aa,
            transparent: true,
            opacity: 0.05, // Quase invisível
            transmission: 0.9,
            thickness: 0.05,
            wireframe: true // Wireframe para leveza
        });
        const cleft = new THREE.Mesh(cleftGeometry, cleftMaterial);
        synapseGroup.add(cleft);
        
        // Presynaptic terminal
        const preTerminalGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const preTerminalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3, // Mais transparente
            roughness: 0.2,
            wireframe: true // Wireframe para leveza
        });
        const preTerminal = new THREE.Mesh(preTerminalGeometry, preTerminalMaterial);
        preTerminal.position.x = -1;
        synapseGroup.add(preTerminal);
        
        // Postsynaptic terminal
        const postTerminalGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const postTerminalMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x88ff44,
            transparent: true,
            opacity: 0.3, // Mais transparente
            roughness: 0.2,
            wireframe: true // Wireframe para leveza
        });
        const postTerminal = new THREE.Mesh(postTerminalGeometry, postTerminalMaterial);
        postTerminal.position.x = 1;
        synapseGroup.add(postTerminal);
        
        synapseGroup.position.set(...config.position);
        synapseGroup.userData = {
            presynaptic: config.presynaptic,
            postsynaptic: config.postsynaptic,
            preTerminal: preTerminal,
            postTerminal: postTerminal
        };
        
        this.scene.add(synapseGroup);
        return synapseGroup;
    }
    
    createSynapticVesicles(synapse) {
        const vesicleCount = 20;
        
        for (let i = 0; i < vesicleCount; i++) {
            const vesicleGeometry = new THREE.SphereGeometry(0.1, 12, 12);
            const vesicleMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xff88ff,
                transparent: true,
                opacity: 0.5, // Mais transparente
                emissive: 0x442244,
                emissiveIntensity: 0.2, // Menos emissão
                roughness: 0.1,
                metalness: 0.2,
                wireframe: true // Wireframe para leveza
            });
            
            const vesicle = new THREE.Mesh(vesicleGeometry, vesicleMaterial);
            vesicle.position.set(
                -0.8 + Math.random() * 0.6,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            
            vesicle.userData = {
                originalPosition: vesicle.position.clone(),
                released: false,
                releaseTime: 0
            };
            
            synapse.add(vesicle);
            this.vesicles.push(vesicle);
        }
    }
    
    createIonChannels(synapse) {
        // Sodium channels
        for (let i = 0; i < 8; i++) {
            const channelGroup = this.createIonChannel('sodium', 0xffaa00);
            channelGroup.position.set(
                -0.9,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            synapse.add(channelGroup);
            this.ionChannels.push(channelGroup);
        }
        
        // Potassium channels
        for (let i = 0; i < 6; i++) {
            const channelGroup = this.createIonChannel('potassium', 0x00aaff);
            channelGroup.position.set(
                -0.9,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            synapse.add(channelGroup);
            this.ionChannels.push(channelGroup);
        }
        
        // Calcium channels
        for (let i = 0; i < 4; i++) {
            const channelGroup = this.createIonChannel('calcium', 0xff6600);
            channelGroup.position.set(
                -0.9,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            synapse.add(channelGroup);
            this.ionChannels.push(channelGroup);
        }
    }
    
    createIonChannel(type, color) {
        const channelGroup = new THREE.Group();
        
        // Channel pore
        const poreGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
        const poreMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.4, // Mais transparente
            emissive: color,
            emissiveIntensity: 0.1, // Menos emissão
            metalness: 0.3,
            roughness: 0.1,
            wireframe: true // Wireframe para leveza
        });
        const pore = new THREE.Mesh(poreGeometry, poreMaterial);
        pore.rotation.z = Math.PI / 2;
        channelGroup.add(pore);
        
        // Channel proteins
        for (let i = 0; i < 4; i++) {
            const proteinGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.15);
            const proteinMaterial = new THREE.MeshPhysicalMaterial({
                color: color,
                transparent: true,
                opacity: 0.3, // Mais transparente
                roughness: 0.2,
                wireframe: true // Wireframe para leveza
            });
            const protein = new THREE.Mesh(proteinGeometry, proteinMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            protein.position.set(
                Math.cos(angle) * 0.08,
                Math.sin(angle) * 0.08,
                0
            );
            channelGroup.add(protein);
        }
        
        channelGroup.userData = { type: type, isOpen: false };
        return channelGroup;
    }
    
    createReceptors(synapse) {
        // AMPA receptors
        for (let i = 0; i < 10; i++) {
            const receptor = this.createReceptor('AMPA', 0x8888ff);
            receptor.position.set(
                0.9,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            synapse.add(receptor);
        }
        
        // NMDA receptors
        for (let i = 0; i < 6; i++) {
            const receptor = this.createReceptor('NMDA', 0xaa44ff);
            receptor.position.set(
                0.9,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            );
            synapse.add(receptor);
        }
    }
    
    createReceptor(type, color) {
        const receptorGroup = new THREE.Group();
        
        // Receptor body
        const bodyGeometry = new THREE.BoxGeometry(0.12, 0.12, 0.08);
        const bodyMaterial = new THREE.MeshPhysicalMaterial({
            color: color,
            transparent: true,
            opacity: 0.4, // Mais transparente
            roughness: 0.2,
            metalness: 0.1,
            wireframe: true // Wireframe para leveza
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        receptorGroup.add(body);
        
        // Binding site
        const siteGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const siteMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3, // Mais transparente
            emissive: color,
            emissiveIntensity: 0.05, // Menos emissão
            wireframe: true // Wireframe para leveza
        });
        const site = new THREE.Mesh(siteGeometry, siteMaterial);
        site.position.x = -0.08;
        receptorGroup.add(site);
        
        receptorGroup.userData = { type: type, bound: false };
        return receptorGroup;
    }
    
    createEnvironment() {
        // Neural network background
        this.createNeuralNetwork();
        
        // Floating particles for ambience
        this.createAmbientParticles();
    }
    
    createNeuralNetwork() {
        const networkGeometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        // Create network connections
        for (let i = 0; i < 50; i++) {
            const start = new THREE.Vector3(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 40
            );
            
            const end = new THREE.Vector3(
                start.x + (Math.random() - 0.5) * 10,
                start.y + (Math.random() - 0.5) * 10,
                start.z + (Math.random() - 0.5) * 10
            );
            
            positions.push(start.x, start.y, start.z);
            positions.push(end.x, end.y, end.z);
            
            const color = new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.7, 0.3);
            colors.push(color.r, color.g, color.b);
            colors.push(color.r, color.g, color.b);
        }
        
        networkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        networkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const networkMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.3
        });
        
        const network = new THREE.LineSegments(networkGeometry, networkMaterial);
        this.scene.add(network);
    }
    
    createAmbientParticles() {
        const particleGeometry = new THREE.BufferGeometry();
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
            
            const color = new THREE.Color().setHSL(0.6 + Math.random() * 0.4, 0.8, 0.5);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
            
            sizes[i] = Math.random() * 0.1 + 0.05;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        this.ambientParticles = particles;
    }
    
    setupMouseControls() {
        this.mouseControls = {
            isDragging: false,
            previousMouse: { x: 0, y: 0 },
            rotation: { x: 0, y: 0 },
            distance: 15
        };
        
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('mousedown', (event) => {
            this.mouseControls.isDragging = true;
            this.mouseControls.previousMouse = { x: event.clientX, y: event.clientY };
        });
        
        canvas.addEventListener('mousemove', (event) => {
            if (!this.mouseControls.isDragging) return;
            
            const deltaX = event.clientX - this.mouseControls.previousMouse.x;
            const deltaY = event.clientY - this.mouseControls.previousMouse.y;
            
            this.mouseControls.rotation.y -= deltaX * 0.01;
            this.mouseControls.rotation.x -= deltaY * 0.01;
            
            // Limitar rotação vertical
            this.mouseControls.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.mouseControls.rotation.x));
            
            this.updateCameraPosition();
            
            this.mouseControls.previousMouse = { x: event.clientX, y: event.clientY };
        });
        
        canvas.addEventListener('mouseup', () => {
            this.mouseControls.isDragging = false;
        });
        
        canvas.addEventListener('wheel', (event) => {
            this.mouseControls.distance += event.deltaY * 0.01;
            this.mouseControls.distance = Math.max(5, Math.min(30, this.mouseControls.distance));
            this.updateCameraPosition();
            event.preventDefault();
        });
    }
    
    updateCameraPosition() {
        if (this.currentCameraTarget === 'overview') {
            const x = Math.cos(this.mouseControls.rotation.y) * Math.cos(this.mouseControls.rotation.x) * this.mouseControls.distance;
            const y = Math.sin(this.mouseControls.rotation.x) * this.mouseControls.distance;
            const z = Math.sin(this.mouseControls.rotation.y) * Math.cos(this.mouseControls.rotation.x) * this.mouseControls.distance;
            
            this.camera.position.set(x, y, z);
            this.camera.lookAt(0, 0, 0);
        }
    }
    
    setupControls() {
        // Play/Pause button
        document.getElementById('playPause').addEventListener('click', () => {
            this.toggleSimulation();
        });
        
        // Reset button
        document.getElementById('resetSim').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        // Zoom synapse button
        document.getElementById('zoomSynapse').addEventListener('click', () => {
            this.zoomToSynapse();
        });
        
        // Toggle labels button
        document.getElementById('toggleLabels').addEventListener('click', () => {
            this.toggleLabels();
        });
    }
    
    toggleSimulation() {
        this.isPlaying = !this.isPlaying;
        const button = document.getElementById('playPause');
        button.textContent = this.isPlaying ? '⏸ Pausar Simulação' : '▶ Iniciar Simulação';
        
        if (this.isPlaying) {
            this.loopCount = 0; // Reset contador ao iniciar
            this.startActionPotential();
        }
    }
    
    resetSimulation() {
        this.isPlaying = false;
        this.currentStep = 0;
        this.time = 0;
        
        // Reset UI
        document.getElementById('playPause').textContent = '▶ Iniciar Simulação';
        this.updateProcessIndicator(0);
        
        // Reset vesicles
        this.vesicles.forEach(vesicle => {
            vesicle.position.copy(vesicle.userData.originalPosition);
            vesicle.userData.released = false;
            vesicle.userData.releaseTime = 0;
        });
        
        // Reset action potentials
        this.actionPotentials = [];
        
        // Reset neurotransmitters
        this.neurotransmitters.forEach(nt => {
            if (nt.parent) nt.parent.remove(nt);
        });
        this.neurotransmitters = [];
        
        // Reset camera
        this.currentCameraTarget = 'overview';
        this.animateCamera(this.cameraTargets.overview);
    }
    
    zoomToSynapse() {
        this.currentCameraTarget = 'synapse';
        this.animateCamera(this.cameraTargets.synapse);
    }
    
    toggleLabels() {
        this.labelsVisible = !this.labelsVisible;
        const button = document.getElementById('toggleLabels');
        button.textContent = this.labelsVisible ? '🏷 Ocultar Legendas' : '🏷 Mostrar Legendas';
    }
    
    animateCamera(target) {
        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(...target.position);
        const duration = 2000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = this.easeInOutCubic(progress);
            
            this.camera.position.lerpVectors(startPos, endPos, easedProgress);
            this.camera.lookAt(...target.target);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
    
    startActionPotential() {
        // Verificar se deve continuar o loop
        if (this.loopCount >= this.maxLoops) {
            this.isPlaying = false;
            document.getElementById('playPause').textContent = '▶ Iniciar Simulação';
            this.loopCount = 0; // Reset para próxima execução
            return;
        }
        
        const actionPotential = {
            position: -8,
            speed: 0.040, // Ligeiramente mais rápido para fluidez
            amplitude: 1,
            active: true
        };
        
        this.actionPotentials.push(actionPotential);
        this.updateProcessIndicator(1);
    }
    
    updateProcessIndicator(step) {
        // Remove active class from all steps
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`step${i}`).classList.remove('active');
        }
        
        // Add active class to current step
        if (step > 0) {
            document.getElementById(`step${step}`).classList.add('active');
        }
        
        this.currentStep = step;
    }
    
    updateActionPotentials() {
        this.actionPotentials.forEach((ap, index) => {
            if (ap.active) {
                ap.position += ap.speed;
                
                // Create visual effect for action potential - efeito mais controlado
                if (ap.position >= -2.5 && ap.position <= 2.5) {
                    this.createElectricalEffect(ap.position);
                }
                
                // Trigger calcium channels when AP reaches synapse - timing ajustado
                if (ap.position >= -1.2 && this.currentStep === 1) {
                    this.openCalciumChannels();
                    setTimeout(() => this.updateProcessIndicator(2), 300); // Delay para visualizar
                }
                
                // Release neurotransmitters - timing ajustado
                if (ap.position >= -0.3 && this.currentStep === 2) {
                    this.releaseNeurotransmitters();
                    setTimeout(() => this.updateProcessIndicator(3), 400); // Delay para visualizar
                }
                
                // Remove if traveled far enough
                if (ap.position > 10) {
                    this.actionPotentials.splice(index, 1);
                }
            }
        });
    }
    
    createElectricalEffect(position) {
        // Efeito principal mais visível
        const effectGeometry = new THREE.SphereGeometry(0.6, 16, 16); // Maior e mais detalhado
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 1.0 // Mais opaco inicialmente
        });
        
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.set(position, 0, 0);
        this.scene.add(effect);
        
        // Efeito de ondas concêntricas
        const waveGeometry = new THREE.RingGeometry(0.5, 1.0, 16);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.set(position, 0, 0);
        wave.rotation.x = Math.PI / 2;
        this.scene.add(wave);
        
        // Adicionar luz pontual para o efeito
        const effectLight = new THREE.PointLight(0x00ff88, 2, 5);
        effectLight.position.set(position, 0, 0);
        this.scene.add(effectLight);
        
        // Animate and remove effect - duração visível
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 600; // Duração aumentada para 600ms
            
            if (progress < 1) {
                // Efeito principal pulsa
                const pulse = Math.sin(progress * Math.PI * 4) * 0.3 + 1;
                effect.scale.setScalar(pulse);
                effect.material.opacity = 1.0 * (1 - progress * 0.7);
                
                // Ondas se expandem
                wave.scale.setScalar(1 + progress * 3);
                wave.material.opacity = 0.6 * (1 - progress);
                
                // Luz pulsa
                effectLight.intensity = 2 * (1 - progress * 0.5) * pulse;
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
                this.scene.remove(wave);
                this.scene.remove(effectLight);
            }
        };
        animate();
    }
    
    openCalciumChannels() {
        this.ionChannels.forEach(channel => {
            if (channel.userData.type === 'calcium') {
                channel.userData.isOpen = true;
                
                // Visual effect for opening
                channel.children.forEach(child => {
                    if (child.material) {
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            }
        });
    }
    
    releaseNeurotransmitters() {
        this.vesicles.forEach((vesicle, index) => {
            if (!vesicle.userData.released && Math.random() < 0.3) {
                vesicle.userData.released = true;
                vesicle.userData.releaseTime = this.time;
                
                // Create neurotransmitter particles
                this.createNeurotransmitterParticles(vesicle.position.clone());
            }
        });
    }
    
    createNeurotransmitterParticles(startPosition) {
        for (let i = 0; i < 8; i++) { // Mais partículas
            const particleGeometry = new THREE.SphereGeometry(0.06, 12, 12); // Partículas maiores e mais detalhadas
            const particleMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xff4444,
                transparent: true,
                opacity: 0.9,
                emissive: 0x442222,
                emissiveIntensity: 0.4,
                roughness: 0.1,
                metalness: 0.2
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(startPosition);
            particle.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3,
                (Math.random() - 0.5) * 0.3
            ));
            
            // Adicionar luz às partículas para maior visibilidade
            const particleLight = new THREE.PointLight(0xff4444, 0.5, 2);
            particle.add(particleLight);
            
            particle.userData = {
                velocity: new THREE.Vector3(0.025, (Math.random() - 0.5) * 0.006, (Math.random() - 0.5) * 0.006), // Movimento mais controlado
                startTime: this.time,
                lifetime: 2500, // Duração aumentada para visualizar
                originalScale: 1
            };
            
            this.synapses[0].add(particle);
            this.neurotransmitters.push(particle);
        }
    }
    
    updateNeurotransmitters() {
        this.neurotransmitters.forEach((nt, index) => {
            const age = this.time - nt.userData.startTime;
            
            if (age < nt.userData.lifetime) {
                // Move across synaptic cleft
                nt.position.add(nt.userData.velocity);
                
                // Adicionar movimento de flutuação
                const floatEffect = Math.sin((this.time + index * 100) * 0.005) * 0.05;
                nt.position.y += floatEffect * 0.1;
                
                // Efeito de pulsação
                const pulseEffect = Math.sin(this.time * 0.01 + index) * 0.2 + 1;
                nt.scale.setScalar(nt.userData.originalScale * pulseEffect);
                
                // Check for receptor binding - detecção controlada
                if (nt.position.x > 0.6 && this.currentStep === 3) {
                    this.bindToReceptor(nt);
                    setTimeout(() => this.updateProcessIndicator(4), 200); // Delay para visualizar
                }
                
                // Fade out mais suave
                const fadeProgress = age / nt.userData.lifetime;
                nt.material.opacity = 0.9 * (1 - fadeProgress * 0.8);
                
                // Ajustar emissão baseada na idade
                if (nt.material.emissiveIntensity) {
                    nt.material.emissiveIntensity = 0.4 * (1 - fadeProgress * 0.5);
                }
            } else {
                // Remove expired neurotransmitter
                if (nt.parent) nt.parent.remove(nt);
                this.neurotransmitters.splice(index, 1);
            }
        });
    }
    
    bindToReceptor(neurotransmitter) {
        // Find nearby receptor
        const receptors = this.synapses[0].children.filter(child => 
            child.userData && child.userData.type && !child.userData.bound
        );
        
        if (receptors.length > 0) {
            const receptor = receptors[0];
            receptor.userData.bound = true;
            
            // Visual effect for binding
            receptor.children.forEach(child => {
                if (child.material) {
                    child.material.emissiveIntensity = 0.4;
                }
            });
            
            // Trigger postsynaptic response - resposta visível
            setTimeout(() => {
                this.triggerPostsynapticResponse();
                setTimeout(() => this.updateProcessIndicator(5), 300); // Delay para visualizar
            }, 500); // Tempo para visualizar ligação
        }
    }
    
    triggerPostsynapticResponse() {
        // Open sodium channels in postsynaptic neuron
        this.ionChannels.forEach(channel => {
            if (channel.userData.type === 'sodium') {
                channel.userData.isOpen = true;
                
                // Visual effect
                channel.children.forEach(child => {
                    if (child.material) {
                        child.material.emissiveIntensity = 0.5;
                    }
                });
            }
        });
        
        // Create depolarization effect
        this.createDepolarizationEffect();
    }
    
    createDepolarizationEffect() {
        // Efeito principal mais visível
        const effectGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const effectMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ff44,
            transparent: true,
            opacity: 0.6 // Mais visível
        });
        
        const effect = new THREE.Mesh(effectGeometry, effectMaterial);
        effect.position.set(1, 0, 0);
        this.scene.add(effect);
        
        // Efeito de ondas múltiplas
        const waves = [];
        for (let i = 0; i < 3; i++) {
            const waveGeometry = new THREE.SphereGeometry(0.8 + i * 0.3, 16, 16);
            const waveMaterial = new THREE.MeshBasicMaterial({
                color: 0x44ff88,
                transparent: true,
                opacity: 0.4 - i * 0.1,
                wireframe: true
            });
            
            const wave = new THREE.Mesh(waveGeometry, waveMaterial);
            wave.position.set(1, 0, 0);
            this.scene.add(wave);
            waves.push(wave);
        }
        
        // Luz pontual para o efeito
        const depolarLight = new THREE.PointLight(0x88ff44, 3, 8);
        depolarLight.position.set(1, 0, 0);
        this.scene.add(depolarLight);
        
        // Animate effect - duração visível
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 1000; // Duração aumentada para 1000ms
            
            if (progress < 1) {
                // Efeito principal pulsa
                const pulse = Math.sin(progress * Math.PI * 3) * 0.4 + 1;
                effect.scale.setScalar(pulse);
                effect.material.opacity = 0.6 * (1 - progress * 0.6);
                
                // Ondas se expandem em tempos diferentes
                waves.forEach((wave, i) => {
                    const waveProgress = Math.max(0, progress - i * 0.1);
                    wave.scale.setScalar(1 + waveProgress * 2);
                    wave.material.opacity = (0.4 - i * 0.1) * (1 - waveProgress);
                    wave.rotation.y += 0.02;
                });
                
                // Luz pulsa
                depolarLight.intensity = 3 * (1 - progress * 0.3) * pulse;
                
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(effect);
                waves.forEach(wave => this.scene.remove(wave));
                this.scene.remove(depolarLight);
                
                // Reset for next cycle if still playing - pausa visível
                if (this.isPlaying) {
                    setTimeout(() => {
                        this.resetForNextCycle();
                    }, 800); // Tempo para visualizar despolarização
                }
            }
        };
        animate();
    }
    
    resetForNextCycle() {
        // Reset process indicator
        this.updateProcessIndicator(0);
        
        // Reset ion channels
        this.ionChannels.forEach(channel => {
            channel.userData.isOpen = false;
            channel.children.forEach(child => {
                if (child.material) {
                    child.material.emissiveIntensity = 0.2;
                }
            });
        });
        
        // Reset receptors
        this.synapses[0].children.forEach(child => {
            if (child.userData && child.userData.type) {
                child.userData.bound = false;
                child.children.forEach(subChild => {
                    if (subChild.material) {
                        subChild.material.emissiveIntensity = 0.1;
                    }
                });
            }
        });
        
        // Start new action potential - ciclo educativo com controle
        if (this.isPlaying) {
            this.loopCount++; // Incrementar contador de loops
            setTimeout(() => {
                this.startActionPotential();
            }, 1800); // Pausa ligeiramente menor para fluidez
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time = Date.now();
        
        if (this.isPlaying) {
            this.updateActionPotentials();
            this.updateNeurotransmitters();
        }
        
        // Animate ambient particles
        if (this.ambientParticles) {
            this.ambientParticles.rotation.y += 0.001;
        }
        
        // Câmera controlada manualmente no modo overview
        if (this.currentCameraTarget === 'overview') {
            // A posição da câmera agora é controlada pelos controles do mouse
            this.camera.lookAt(0, 0, 0);
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize simulation when page loads
window.addEventListener('load', () => {
    new NeuralSimulation();
});
