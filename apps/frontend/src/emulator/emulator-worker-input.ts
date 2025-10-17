import {
    type EmulatorInputEvent,
    type EmulatorWorkerFallbackInputConfig,
    type EmulatorWorkerSharedMemoryInputConfig,
    updateInputBufferWithEvents,
    InputBufferAddresses,
    LockStates,
} from "./emulator-common";
import {type EmulatorFallbackEndpoint} from "./emulator-worker";

export interface EmulatorWorkerInput {
    idleWait(timeout: number): boolean;
    sleep(timeout: number): void;
    acquireInputLock(): number;
    releaseInputLock(): void;
    getInputValue(addr: number): number;
}

export class SharedMemoryEmulatorWorkerInput implements EmulatorWorkerInput {
    #inputBufferView: Int32Array;
    #sleepInputBufferView: Int32Array;

    constructor(config: EmulatorWorkerSharedMemoryInputConfig) {
        this.#inputBufferView = new Int32Array(
            config.inputBuffer,
            0,
            config.inputBufferSize
        );
        this.#sleepInputBufferView = new Int32Array(new SharedArrayBuffer(4));
    }

    idleWait(timeout: number): boolean {
        const waitResult = Atomics.wait(
            this.#inputBufferView,
            InputBufferAddresses.globalLockAddr,
            LockStates.READY_FOR_UI_THREAD,
            timeout
        );
        const hadInput = waitResult === "ok";
        return hadInput;
    }

    sleep(timeout: number): void {
        // sleepInputBufferView will never change, just use it to wait
        // efficiently.
        Atomics.wait(this.#sleepInputBufferView, 0, 0, timeout);
    }

    acquireInputLock(): number {
        const hasLock = tryToAcquireCyclicalLock(
            this.#inputBufferView,
            InputBufferAddresses.globalLockAddr
        );
        if (!hasLock) {
            return 0;
        }
        const isPaused =
            this.#inputBufferView[InputBufferAddresses.pausedAddr] === 1;
        if (isPaused) {
            console.log("Emulator paused, waiting for input");
            const startTime = performance.now();
            Atomics.wait(
                this.#inputBufferView,
                InputBufferAddresses.pausedAddr,
                1
            );
            console.log(
                "Emulator unpaused after",
                ((performance.now() - startTime) / 1000).toFixed(1),
                "seconds"
            );
        }

        return 1;
    }

    releaseInputLock() {
        resetInputBuffer(this.#inputBufferView);

        releaseCyclicalLock(
            this.#inputBufferView,
            InputBufferAddresses.globalLockAddr
        );
    }

    getInputValue(addr: number): number {
        return this.#inputBufferView[addr];
    }
}

function tryToAcquireCyclicalLock(
    bufferView: Int32Array,
    lockIndex: number
): number {
    const res = Atomics.compareExchange(
        bufferView,
        lockIndex,
        LockStates.READY_FOR_EMUL_THREAD,
        LockStates.EMUL_THREAD_LOCK
    ) as LockStates;
    if (res === LockStates.READY_FOR_EMUL_THREAD) {
        return 1;
    }
    return 0;
}

function releaseCyclicalLock(bufferView: Int32Array, lockIndex: number) {
    Atomics.store(bufferView, lockIndex, LockStates.READY_FOR_UI_THREAD);
}

export class FallbackEmulatorWorkerInput implements EmulatorWorkerInput {
    #fallbackEndpoint: EmulatorFallbackEndpoint;
    #inputBuffer: Int32Array;
    #inputQueue: EmulatorInputEvent[] = [];

    constructor(
        config: EmulatorWorkerFallbackInputConfig,
        fallbackEndpoint: EmulatorFallbackEndpoint
    ) {
        this.#fallbackEndpoint = fallbackEndpoint;
        this.#inputBuffer = new Int32Array(config.inputBufferSize);
    }

    idleWait(timeout: number): boolean {
        this.#fallbackEndpoint.idleWait(timeout);
        return false;
    }

    sleep(timeout: number): void {
        const endTime = performance.now() + timeout;
        while (performance.now() < endTime) {
            // Not worth hitting the fallback endpoint, the timeouts are too
            // short.
        }
    }

    acquireInputLock(): number {
        this.#inputQueue = this.#inputQueue.concat(
            this.#fallbackEndpoint.consumeInputEvents()
        );
        this.#inputQueue = updateInputBufferWithEvents(
            this.#inputQueue,
            this.#inputBuffer
        );
        return 1;
    }

    releaseInputLock(): void {
        resetInputBuffer(this.#inputBuffer);
    }

    getInputValue(addr: number): number {
        return this.#inputBuffer[addr];
    }
}

function resetInputBuffer(inputBuffer: Int32Array) {
    inputBuffer[InputBufferAddresses.mousePositionFlagAddr] = 0;
    inputBuffer[InputBufferAddresses.mousePositionXAddr] = 0;
    inputBuffer[InputBufferAddresses.mousePositionYAddr] = 0;
    inputBuffer[InputBufferAddresses.mouseButtonStateAddr] = 0;
    inputBuffer[InputBufferAddresses.keyEventFlagAddr] = 0;
    inputBuffer[InputBufferAddresses.keyCodeAddr] = 0;
    inputBuffer[InputBufferAddresses.keyStateAddr] = 0;
    inputBuffer[InputBufferAddresses.speedFlagAddr] = 0;
    inputBuffer[InputBufferAddresses.speedAddr] = 0;
}
