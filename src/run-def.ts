import {BroadcastChannelEthernetProvider} from "./BroadcastChannelEthernetProvider";
import {CloudflareWorkerEthernetProvider} from "./CloudflareWorkerEthernetProvider";
import {fromDateString, toDateString} from "./dates";
import {
    ALL_DISKS,
    DISKS_BY_YEAR,
    FLOPPY_DISKS,
    isPlaceholderDiskDef,
    type DiskFile,
    type SystemDiskDef,
} from "./disks";
import {type EmulatorEthernetProvider} from "./emulator/emulator-ui";
import {
    type EmulatorSettings,
    DEFAULT_EMULATOR_SETTINGS,
} from "./emulator/emulator-ui-settings";
import {
    MACHINES_BY_NAME,
    type MachineDefRAMSize,
    type MachineDef,
} from "./machines";

export type RunDef = {
    machine: MachineDef;
    ramSize?: MachineDefRAMSize;
    screenSize: ScreenSize;
    screenScale?: number;
    disks: SystemDiskDef[];
    diskFiles: DiskFile[];
    cdromURLs: string[];
    cdromPrefetchChunks: number[][];
    diskURLs?: string[];
    diskPrefetchChunks?: number[][];
    includeInfiniteHD: boolean;
    includeSavedHD: boolean;
    includeLibrary: boolean;
    libraryDownloadURLs: string[];
    ethernetProvider?: EmulatorEthernetProvider;
    // Force non-SharedArrayBuffer mode for debugging
    debugFallback?: boolean;
    debugAudio?: boolean;
    debugPaused?: boolean;
    debugLog?: boolean;
    debugTrackpad?: boolean;
    isCustom?: boolean;
    customDate?: Date;

    isEmbed?: boolean;
    screenUpdateMessages?: boolean;
    startPaused?: boolean;
    autoPause?: boolean;
    settings?: EmulatorSettings;
};

export type ScreenSize =
    | "auto"
    | "fullscreen"
    | "window"
    | "embed"
    | {width: number; height: number};

export function runDefFromUrl(urlString: string): RunDef | undefined {
    let url;
    try {
        url = new URL(urlString);
    } catch (e) {
        return undefined;
    }

    const {searchParams, pathname} = url;

    let isCustom = searchParams.has("edit");
    const isEmbed = pathname === "/embed";
    const screenUpdateMessages =
        isEmbed && searchParams.get("screen_update_messages") === "true";
    const startPaused = searchParams.get("paused") === "true";
    const autoPause = searchParams.get("auto_pause") === "true";
    let includeInfiniteHD;
    let includeSavedHD;
    const includeLibrary = searchParams.get("library") !== "false";
    const libraryDownloadURLs = [...searchParams.getAll("library_url")];
    const disks: SystemDiskDef[] = [];
    const yearDiskDef = diskFromYearPath(url.pathname);
    if (yearDiskDef) {
        disks.push(yearDiskDef);
        includeInfiniteHD = searchParams.get("infinite_hd") !== "false";
        includeSavedHD = searchParams.get("saved_hd") !== "false";
    } else {
        includeInfiniteHD = searchParams.get("infinite_hd") === "true";
        includeSavedHD = searchParams.get("saved_hd") === "true";
        isCustom = true;
    }

    for (const diskName of searchParams.getAll("disk")) {
        const disk =
            ALL_DISKS.find(disk => disk.displayName === diskName) ??
            FLOPPY_DISKS.find(disk => disk.displayName === diskName);
        if (disk && !isPlaceholderDiskDef(disk)) {
            disks.push(disk);
        }
    }

    let machine: MachineDef | undefined = undefined;
    const machineName = searchParams.get("machine");
    if (machineName) {
        machine = MACHINES_BY_NAME[machineName];
        isCustom = true;
    }
    if (!machine && disks.length > 0) {
        machine = disks[0].preferredMachine;
    }
    if (!machine) {
        return undefined;
    }
    let ramSize: MachineDefRAMSize | undefined = undefined;
    const ramSizeParam = searchParams.get("ram") as MachineDefRAMSize | null;
    if (ramSizeParam && machine.ramSizes.includes(ramSizeParam)) {
        ramSize = ramSizeParam;
        isCustom = true;
    }
    let screenSize: ScreenSize = isEmbed ? "embed" : "auto";
    const screenSizeParam = searchParams.get("screenSize");
    switch (screenSizeParam) {
        case "auto":
        case "fullscreen":
        case "window":
            screenSize = screenSizeParam;
            break;
        case null:
            break;
        default: {
            const [width, height] = screenSizeParam
                .split("x")
                .map(s => parseInt(s));
            if (!isNaN(width) && !isNaN(height)) {
                screenSize = {width, height};
            }
            break;
        }
    }
    let screenScale: number | undefined = undefined;
    const screenScaleParam =
        searchParams.get("screen_scale") ?? searchParams.get("screenScale");
    if (screenScaleParam) {
        const scale = parseFloat(screenScaleParam);
        if (!isNaN(scale)) {
            screenScale = scale;
        }
    }

    const cdromURLs = [
        ...searchParams.getAll("cdrom"),
        ...searchParams.getAll("cdrom_url"),
    ];
    const cdromPrefetchChunks: number[][] = [];
    for (const cdromPrefetch of searchParams.getAll("cdrom_prefetch")) {
        const chunks = cdromPrefetch
            .split(",")
            .map(s => parseInt(s))
            .filter(n => !isNaN(n));
        if (chunks.length > 0) {
            cdromPrefetchChunks.push(chunks);
        }
    }

    const diskURLs = searchParams.getAll("disk_url");
    const diskPrefetchChunks: number[][] = [];
    for (const diskPrefetch of searchParams.getAll("disk_prefetch")) {
        const chunks = diskPrefetch
            .split(",")
            .map(s => parseInt(s))
            .filter(n => !isNaN(n));
        if (chunks.length > 0) {
            diskPrefetchChunks.push(chunks);
        }
    }

    let ethernetProvider;
    const appleTalkZoneName = searchParams.get("appleTalk");
    if (appleTalkZoneName) {
        ethernetProvider = new CloudflareWorkerEthernetProvider(
            appleTalkZoneName
        );
    } else if (searchParams.get("broadcast_channel_ethernet") === "true") {
        ethernetProvider = new BroadcastChannelEthernetProvider();
    }

    let customDate;
    const customDateParam = searchParams.get("date");
    if (customDateParam) {
        customDate = fromDateString(customDateParam);
    }
    const debugFallback = searchParams.get("debug_fallback") === "true";
    const debugAudio = searchParams.get("debug_audio") === "true";
    const debugPaused = searchParams.get("debug_paused") === "true";
    const debugLog = searchParams.get("debug_log") === "true";
    const debugTrackpad = searchParams.get("debug_trackpad") === "true";
    const emulatorSettingsParam = searchParams.get("settings");
    let settings: EmulatorSettings | undefined = isEmbed
        ? DEFAULT_EMULATOR_SETTINGS
        : undefined;
    if (emulatorSettingsParam) {
        try {
            settings = {
                ...DEFAULT_EMULATOR_SETTINGS,
                ...JSON.parse(emulatorSettingsParam),
            };
        } catch (e) {
            console.error("Invalid emulator settings JSON, ignoring:", e);
        }
    }

    return {
        disks,
        includeInfiniteHD,
        includeSavedHD,
        includeLibrary,
        libraryDownloadURLs,
        machine,
        ramSize,
        screenSize,
        screenScale,
        ethernetProvider,
        cdromURLs,
        cdromPrefetchChunks,
        diskURLs,
        diskPrefetchChunks,
        diskFiles: [],
        customDate,
        debugFallback,
        debugAudio,
        debugPaused,
        debugLog,
        debugTrackpad,
        isCustom,
        isEmbed,
        screenUpdateMessages,
        startPaused,
        autoPause,
        settings,
    };
}

export function runDefToUrl(runDef: RunDef, toEmbed: boolean = false): string {
    const {disks, machine, ethernetProvider} = runDef;
    let url: URL;
    if (
        disks.length === 1 &&
        ALL_DISKS.includes(disks[0]) &&
        !disks[0].hiddenInBrowser &&
        !toEmbed
    ) {
        url = new URL(diskToYearPath(disks[0]), location.href);
        if (!runDef.includeInfiniteHD) {
            url.searchParams.set("infinite_hd", "false");
        }
        if (!runDef.includeSavedHD) {
            url.searchParams.set("saved_hd", "false");
        }
    } else {
        url = new URL(toEmbed ? "/embed" : "/run", location.href);
        for (const disk of disks) {
            url.searchParams.append("disk", disk.displayName);
        }
        if (runDef.includeInfiniteHD) {
            url.searchParams.set("infinite_hd", "true");
        }
        if (runDef.includeSavedHD) {
            url.searchParams.set("saved_hd", "true");
        }
    }
    if (!runDef.includeLibrary && !toEmbed) {
        url.searchParams.set("library", "false");
    }
    for (const libraryURL of runDef.libraryDownloadURLs) {
        url.searchParams.append("library_url", libraryURL);
    }
    for (const cdromURL of runDef.cdromURLs) {
        url.searchParams.append("cdrom", cdromURL);
    }
    for (const cdromPrefetch of runDef.cdromPrefetchChunks) {
        url.searchParams.append("cdrom_prefetch", cdromPrefetch.join(","));
    }
    for (const diskURL of runDef.diskURLs ?? []) {
        url.searchParams.append("disk_url", diskURL);
    }
    for (const diskPrefetch of runDef.diskPrefetchChunks ?? []) {
        url.searchParams.append("disk_prefetch", diskPrefetch.join(","));
    }

    if (
        toEmbed ||
        disks.length !== 1 ||
        machine !== disks[0].preferredMachine
    ) {
        url.searchParams.set("machine", machine.name);
    }
    if (runDef.ramSize && runDef.ramSize !== machine.ramSizes[0]) {
        url.searchParams.set("ram", runDef.ramSize);
    }
    if (runDef.screenSize !== "auto") {
        url.searchParams.set(
            "screenSize",
            typeof runDef.screenSize === "object"
                ? `${runDef.screenSize.width}x${runDef.screenSize.height}`
                : runDef.screenSize
        );
    }
    if (runDef.screenScale && runDef.screenScale !== 1) {
        url.searchParams.set("screen_scale", runDef.screenScale.toString());
    }
    if (ethernetProvider instanceof CloudflareWorkerEthernetProvider) {
        url.searchParams.set("appleTalk", ethernetProvider.zoneName());
    } else if (ethernetProvider instanceof BroadcastChannelEthernetProvider) {
        url.searchParams.set("broadcast_channel_ethernet", "true");
    }
    if (runDef.customDate) {
        url.searchParams.set("date", toDateString(runDef.customDate));
    }

    if (runDef.debugAudio) {
        url.searchParams.set("debug_audio", "true");
    }
    if (runDef.debugLog) {
        url.searchParams.set("debug_log", "true");
    }
    if (runDef.debugPaused) {
        url.searchParams.set("debug_paused", "true");
    }
    if (runDef.debugFallback) {
        url.searchParams.set("debug_fallback", "true");
    }
    if (runDef.debugTrackpad) {
        url.searchParams.set("debug_trackpad", "true");
    }
    if (runDef.startPaused) {
        url.searchParams.set("paused", "true");
    }
    if (runDef.autoPause) {
        url.searchParams.set("auto_pause", "true");
    }
    if (runDef.screenUpdateMessages) {
        url.searchParams.set("screen_update_messages", "true");
    }
    if (runDef.settings) {
        url.searchParams.set("settings", JSON.stringify(runDef.settings));
    }
    return url.toString();
}

function diskToYearPath(disk: SystemDiskDef): string {
    const year = Object.entries(DISKS_BY_YEAR).find(([year, disks]) =>
        disks.includes(disk)
    )?.[0];
    return `/${year}/${disk.displayName}`;
}

function diskFromYearPath(pathname: string): SystemDiskDef | undefined {
    const pieces = pathname.split("/");
    if (pieces.length !== 3) {
        return undefined;
    }
    const year = parseInt(pieces[1]);
    if (isNaN(year)) {
        return undefined;
    }
    const disks = DISKS_BY_YEAR[year];
    if (!disks) {
        return undefined;
    }
    const diskName = decodeURIComponent(pieces[2]);
    const disk = disks.find(disk => disk.displayName === diskName);
    if (!disk || isPlaceholderDiskDef(disk)) {
        return undefined;
    }
    return disk;
}
