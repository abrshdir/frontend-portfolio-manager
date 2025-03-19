import { Component, OnInit, OnDestroy, ElementRef, ViewChild, NgZone } from '@angular/core';
import { RealtimeService } from '../../services/realtime.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
    selector: 'app-transcription',
    templateUrl: './transcription.component.html',
    styleUrls: ['./transcription.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule],
    animations: [
        trigger('pulseAnimation', [
            state('true', style({
                transform: 'scale(1.05)',
                boxShadow: '0 0 15px rgba(124, 58, 237, 0.7)'
            })),
            state('false', style({
                transform: 'scale(1)',
                boxShadow: 'none'
            })),
            transition('false <=> true', animate('300ms ease-in-out'))
        ])
    ]
})
export class TranscriptionComponent implements OnInit, OnDestroy {
    peerConnection: RTCPeerConnection | null = null;
    dataChannel: RTCDataChannel | null = null;
    audioElement: HTMLAudioElement | null = null;
    isProcessing = false;
    particles = Array(20).fill(null).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 2 + Math.random() * 2
    }));
    // UI state properties
    private uiStateSubject = new BehaviorSubject<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
    uiState$: Observable<'idle' | 'listening' | 'processing' | 'speaking'> = this.uiStateSubject.asObservable();

    // Transcription observable
    private transcriptionSubject = new BehaviorSubject<string>('Click the microphone icon to begin chatting...');
    transcription$: Observable<string> = this.transcriptionSubject.asObservable();

    audioVisualizerActive = false;
    audioAnalyser: AnalyserNode | null = null;
    visualizerData: Uint8Array = new Uint8Array();
    animationFrameId: number | null = null;
    micPermissionGranted = false;
    showAddressInput = false;
    recipientAddress = '';

    // Session information
    sessionInfo: any = null;

    @ViewChild('audioVisualizer') audioVisualizer!: ElementRef<HTMLCanvasElement>;
    @ViewChild('audioVisualizer') canvasRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('transcriptionContainer') transcriptionContainer!: ElementRef<HTMLDivElement>;

    private ctx!: CanvasRenderingContext2D;
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStream: MediaStream | null = null;
    private animationId: number = 0;
    private rotation: number = 0;

    isRecording: boolean = false;
    conversation = [
        { type: 'assistant', text: 'Hello! How can I help you manage your crypto portfolio?' },
    ];

    constructor(
        private realtimeService: RealtimeService,
        private ngZone: NgZone
    ) { }

    // Getter and setter for uiState to maintain compatibility
    get uiState(): 'idle' | 'listening' | 'processing' | 'speaking' {
        return this.uiStateSubject.value;
    }

    set uiState(value: 'idle' | 'listening' | 'processing' | 'speaking') {
        this.uiStateSubject.next(value);
    }

    // Getter and setter for transcription to maintain compatibility
    get transcription(): string {
        return this.transcriptionSubject.value;
    }

    set transcription(value: string) {
        this.transcriptionSubject.next(value);
        this.scrollTranscriptionToBottom();
    }

    private scrollTranscriptionToBottom(): void {
        setTimeout(() => {
            if (this.transcriptionContainer) {
                const element = this.transcriptionContainer.nativeElement;
                element.scrollTop = element.scrollHeight;
            }
        }, 0);
    }

    ngAfterViewInit() {
        // Add a check to ensure canvas reference exists
        setTimeout(() => {
            if (this.canvasRef && this.canvasRef.nativeElement) {
                const canvas = this.canvasRef.nativeElement;
                this.ctx = canvas.getContext('2d')!;
                this.resizeCanvas();
                window.addEventListener('resize', () => this.resizeCanvas());
                this.drawInitialCircles();
            } else {
                console.warn('Canvas reference not available');
            }
        });
    }

    private resizeCanvas() {
        if (!this.canvasRef || !this.canvasRef.nativeElement) return;
        
        const canvas = this.canvasRef.nativeElement;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        if (!this.isRecording) {
            this.drawInitialCircles();
        }
    }

    private drawInitialCircles() {
        if (!this.canvasRef || !this.canvasRef.nativeElement || !this.ctx) return;
        
        const canvas = this.canvasRef.nativeElement;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;

        this.ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < 2; i++) {
            const circleRadius = radius + (i * 30);
            this.ctx.beginPath();
            this.ctx.strokeStyle = `hsla(${(i * 120) % 360}, 70%, 50%, 0.3)`;
            this.ctx.lineWidth = 1;
            this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }

    async toggleRecording() {
        if (!this.isRecording) {
            await this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    private stopRecording() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.isRecording = false;
        cancelAnimationFrame(this.animationId);
        this.drawInitialCircles();
    }

    private draw() {
        if (!this.analyser || !this.isRecording) return;

        const canvas = this.canvasRef.nativeElement;
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;

        this.ctx.clearRect(0, 0, width, height);

        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        const radius = Math.min(width, height) * 0.4;

        // Draw rotating circles (always visible)
        this.rotation += 0.005;
        for (let i = 0; i < 2; i++) {
            const circleRadius = radius + (i * 30);
            this.ctx.beginPath();
            this.ctx.strokeStyle = `hsla(${(this.rotation * 60 + i * 120) % 360}, 70%, 50%, 0.3)`;
            this.ctx.lineWidth = 1;
            this.ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Calculate average volume to determine visibility of pitch bars
        const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
        if (average > 10) { // Only show pitch bars when there's significant audio
            const barWidth = 4;
            const barGap = 2;
            const barCount = 20;
            const totalWidth = (barWidth + barGap) * barCount;
            let x = centerX - totalWidth / 2;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor(i * (dataArray.length / barCount));
                const barHeight = (dataArray[dataIndex] / 255) * (radius * 0.5);

                this.ctx.fillStyle = `rgba(255, 255, 255, ${average / 255})`;
                this.ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
                x += barWidth + barGap;
            }
        }

        this.animationId = requestAnimationFrame(() => this.draw());
    }

    async startRecording(): Promise<void> {
        this.isRecording = true;
        this.transcription = '';
        this.uiState = 'processing';

        try {
            // First check microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micPermissionGranted = true;

            // Fetch ephemeral key from backend
            const sessionData = await this.realtimeService.getSession().toPromise();
            const EPHEMERAL_KEY = sessionData.client_secret.value;
            this.sessionInfo = sessionData;

            // Create WebRTC peer connection
            this.peerConnection = new RTCPeerConnection();

            // Set up to play remote audio from the model
            if (this.audioElement) {
                this.peerConnection.ontrack = (event) => {
                    if (event.track.kind === 'audio' && this.audioElement) {
                        this.audioElement.srcObject = event.streams[0];
                        this.setupAudioVisualizer(event.streams[0]);
                    }
                };
            }

            // Add local audio track for microphone input
            const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.peerConnection.addTrack(mediaStream.getTracks()[0]);

            // Set up data channel for sending and receiving events
            this.dataChannel = this.peerConnection.createDataChannel('oai-events');
            this.dataChannel.addEventListener('message', (event) => {
                const realtimeEvent = JSON.parse(event.data);
                console.log('Received event:', realtimeEvent);
                this.handleRealtimeEvent(realtimeEvent);
            });

            // Create and send an SDP offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);

            const baseUrl = 'https://api.openai.com/v1/realtime';
            const model = 'gpt-4o-realtime-preview-2024-12-17';
            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: 'POST',
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp',
                },
            });

            const answer = {
                type: 'answer',
                sdp: await sdpResponse.text(),
            };
            await this.peerConnection.setRemoteDescription(answer as RTCSessionDescriptionInit);
            this.uiState = 'idle';
        } catch (error) {
            console.error('Error initializing WebRTC:', error);
            this.isRecording = false;
            this.uiState = 'idle';
            this.micPermissionGranted = false;  // Ensure permission flag is updated
        }
    }

    handleRealtimeEvent(realtimeEvent: any) {
        try {
            // Handle different event types based on their type
            switch (realtimeEvent.type) {
                case 'session.created':
                case 'session.updated':
                    this.sessionInfo = realtimeEvent.session;
                    break;

                case 'input_audio_buffer.speech_started':
                    this.uiState = 'listening';
                    // Clear the transcription when user starts speaking
                    this.transcription = '';
                    break;

                case 'input_audio_buffer.speech_stopped':
                    this.uiState = 'processing';
                    // When user stops speaking, finalize their message in the conversation
                    if (this.transcription.trim() !== '' &&
                        (this.conversation.length === 0 || this.conversation[this.conversation.length - 1].type !== 'user')) {
                        this.conversation.push({
                            type: 'user',
                            text: this.transcription
                        });
                    }
                    break;

                case 'response.created':
                    // AI is about to respond
                    this.uiState = 'processing';
                    break;

                case 'response.output_item.added':
                    // AI is speaking
                    this.uiState = 'speaking';
                    this.audioVisualizerActive = true;
                    // Clear the transcription for the AI's response
                    this.transcription = '';
                    break;

                case 'output_audio_buffer.stopped':
                    // Create a new conversation entry when audio output stops
                    if (this.conversation.length > 0 && 
                        this.conversation[this.conversation.length - 1].type === 'assistant' &&
                        this.transcription.trim() !== '') {
                        // Store the current transcription text
                        const currentText = this.transcription;
                        // Clear the transcription
                        this.transcription = '';
                        // Add a new assistant message with the current text
                        this.conversation.push({
                            type: 'assistant',
                            text: currentText
                        });
                    }
                    break;

                case 'response.completed':
                    this.uiState = 'idle';
                    this.audioVisualizerActive = false;
                    break;

                case 'response.audio_transcript.delta':
                    this.transcribe(realtimeEvent);
                    break;

                default:
                    console.log('Unhandled event type:', realtimeEvent.type);
            }
        } catch (error) {
            console.error('Error handling realtime event:', error);
        }
    }

    transcribe(realtimeEvent: any) {
        try {
            this.ngZone.run(() => {
                // Add to the transcription string
                this.transcription += realtimeEvent.delta;

                // Check if we need to add a new user message to the conversation
                if (this.uiState === 'listening' && realtimeEvent.delta.trim() !== '') {
                    // If we're in listening state and there's no user message yet or the last message is from assistant
                    if (this.conversation.length === 0 || this.conversation[this.conversation.length - 1].type !== 'user') {
                        // Add a new user message with "Recording..." text
                        this.conversation.push({
                            type: 'user',
                            text: 'Recording...'
                        });
                    }
                    // Update the last user message with the current transcription
                    if (this.conversation[this.conversation.length - 1].type === 'user') {
                        this.conversation[this.conversation.length - 1].text = this.transcription;
                    }
                }

                // Handle AI responses
                if (this.uiState === 'speaking' && realtimeEvent.delta.trim() !== '') {
                    // If there's no assistant message yet or the last message is from user
                    if (this.conversation.length === 0 || this.conversation[this.conversation.length - 1].type !== 'assistant') {
                        // Add a new assistant message
                        this.conversation.push({
                            type: 'assistant',
                            text: realtimeEvent.delta
                        });
                    } else {
                        // Update the last assistant message
                        this.conversation[this.conversation.length - 1].text += realtimeEvent.delta;
                    }
                }

                // Scroll to bottom of transcription container
                setTimeout(() => {
                    if (this.transcriptionContainer) {
                        const element = this.transcriptionContainer.nativeElement;
                        element.scrollTop = element.scrollHeight;
                    }
                }, 0);
            });
        }
        catch (error) {
            console.error('Error transcribing:', error);
        }
    }

    setupAudioVisualizer(stream: MediaStream): void {
        this.ngZone.runOutsideAngular(async () => {
            try {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.audioContext = new AudioContext();
                this.analyser = this.audioContext.createAnalyser();

                const source = this.audioContext.createMediaStreamSource(this.mediaStream);
                this.analyser.fftSize = 256;
                source.connect(this.analyser);
                this.isRecording = true;

                this.ngZone.runOutsideAngular(() => {
                    this.draw();
                });

                this.visualizerData = new Uint8Array(this.analyser.frequencyBinCount);

            } catch (error) {
                console.error('Error setting up audio visualizer:', error);
            }
        });
    }

    async checkMicPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.micPermissionGranted = true;
            // Immediately release the stream since we just needed permission check
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            this.micPermissionGranted = false;
            console.error('Microphone permission denied:', err);
        }
    }

    ngOnInit(): void {
        this.audioElement = document.createElement('audio');
        this.audioElement.autoplay = true;
        document.body.appendChild(this.audioElement);
        this.checkMicPermission();  // Initial permission check
    }

    ngOnDestroy(): void {
        this.stopRecording();
        if (this.audioElement) {
            document.body.removeChild(this.audioElement);
        }
        this.stopRecording();
    }
}