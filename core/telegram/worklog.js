import { existsSync, readFileSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";
import moment from "moment-timezone";

const DATA_PATH = resolve(process.cwd(), "core", "var", "data", "worklogs.json");

function save(state) {
    mkdirSync(resolve(process.cwd(), "core", "var", "data"), { recursive: true });
    writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}

function minutesBetween(start, end) {
    return Math.max(0, Math.round((end - start) / 60000));
}

function configuredMinutes() {
    const [startHour, startMinute] = String(global.config.WORK_SHIFT_START || "08:00").split(":").map(Number);
    const [endHour, endMinute] = String(global.config.WORK_SHIFT_END || "17:00").split(":").map(Number);
    const scheduled = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    return Math.max(0, scheduled - Number(global.config.WORK_BREAK_MINUTES || 0));
}

function overtimeMultiplier() {
    const value = Number(global.config.WORK_OVERTIME_MULTIPLIER || 1.5);
    return Number.isFinite(value) && value >= 1 ? value : 1.5;
}

function formatMinutes(total) {
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    return `${hours}h ${minutes}m`;
}

export function createWorklogStore() {
    let state = { logs: [], profiles: {} };
    if (existsSync(DATA_PATH)) {
        try {
            state = JSON.parse(readFileSync(DATA_PATH, "utf8"));
        } catch (error) {
            throw new Error(`Unable to read work-log database: ${error.message}`);
        }
    }
    if (!state || typeof state !== "object") state = {};
    if (!Array.isArray(state.logs)) state.logs = [];
    if (!state.profiles || typeof state.profiles !== "object" || Array.isArray(state.profiles)) {
        state.profiles = {};
    }

    const timezone = () => global.config.timezone || "UTC";
    const store = {
        getProfile(userID) {
            return state.profiles[String(userID)] || null;
        },
        setProfile(userID, profile, { allowRate = true } = {}) {
            const id = String(userID);
            const existing = state.profiles[id] || {};
            const merged = { ...existing, ...profile, userID: id };
            const types = ["direct", "agency", "oncall"];
            const units = ["hour", "day", "fixed"];
            if (!merged.name || !merged.department || !merged.position) {
                throw new Error("Name, department, and position are required");
            }
            if (!types.includes(merged.employmentType)) throw new Error("Employment type must be direct, agency, or oncall");
            if (!units.includes(merged.rateUnit)) throw new Error("Rate unit must be hour, day, or fixed");
            if (!Number.isFinite(Number(merged.rate)) || Number(merged.rate) < 0) throw new Error("Rate must be a non-negative number");
            if (!allowRate && existing.rate !== undefined &&
                (String(existing.rateUnit) !== String(merged.rateUnit) || Number(existing.rate) !== Number(merged.rate))) {
                throw new Error("Only a moderator can change rate or rate unit");
            }
            merged.rate = Number(merged.rate);
            merged.updatedAt = Date.now();
            state.profiles[id] = merged;
            save(state);
            return merged;
        },
        profiles() {
            return Object.values(state.profiles);
        },
        start({ userID, threadID, photoFileID, timestamp = Date.now() }) {
            const profile = store.getProfile(userID);
            if (!profile) throw new Error("Complete your profile first with /profile set Name|Department|Position|Type|Unit|Rate");
            const open = state.logs.find((log) => log.userID === String(userID) && !log.outAt);
            if (open) throw new Error(`You already clocked in at ${moment(open.inAt).tz(timezone()).format("YYYY-MM-DD HH:mm")}`);
            const local = moment(timestamp).tz(timezone());
            const log = {
                id: `WRK-${Date.now().toString(36).toUpperCase()}`,
                userID: String(userID),
                threadID: String(threadID),
                inAt: new Date(timestamp).toISOString(),
                inDate: local.format("YYYY-MM-DD"),
                inPhotoFileID: photoFileID,
                timezone: timezone(),
                profileSnapshot: { ...profile },
            };
            state.logs.push(log);
            save(state);
            return log;
        },
        stop({ userID, threadID, photoFileID, timestamp = Date.now() }) {
            const log = [...state.logs].reverse().find((item) => item.userID === String(userID) && !item.outAt);
            if (!log) throw new Error("No active work session found. Send a photo captioned In first.");
            const end = new Date(timestamp);
            const totalMinutes = minutesBetween(new Date(log.inAt), end);
            log.outAt = end.toISOString();
            log.outDate = moment(end).tz(timezone()).format("YYYY-MM-DD");
            log.outThreadID = String(threadID);
            log.outPhotoFileID = photoFileID;
            log.totalMinutes = totalMinutes;
            log.regularMinutes = Math.min(totalMinutes, configuredMinutes());
            log.overtimeMinutes = Math.max(0, totalMinutes - log.regularMinutes);
            log.pay = calculatePay(log, log.profileSnapshot);
            save(state);
            return log;
        },
        getOpen(userID) {
            return state.logs.find((log) => log.userID === String(userID) && !log.outAt) || null;
        },
        list(userID, range = "all") {
            const now = moment().tz(timezone());
            let from = null;
            if (range === "today") from = now.clone().startOf("day");
            if (range === "week") from = now.clone().startOf("isoWeek");
            return state.logs.filter((log) => {
                if (log.userID !== String(userID)) return false;
                if (!from) return true;
                return moment(log.inAt).tz(timezone()).isSameOrAfter(from);
            });
        },
        summarize(userID, range) {
            const logs = store.list(userID, range).filter((log) => log.outAt);
            return {
                logs,
                totalMinutes: logs.reduce((sum, log) => sum + log.totalMinutes, 0),
                regularMinutes: logs.reduce((sum, log) => sum + log.regularMinutes, 0),
                overtimeMinutes: logs.reduce((sum, log) => sum + log.overtimeMinutes, 0),
            };
        },
        csv(userID, range) {
            const rows = store.list(userID, range);
            const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
            const header = ["ID", "Employee", "Name", "Department", "Position", "Employment type", "Rate unit", "Rate", "Clock in", "Clock out", "Total minutes", "Regular minutes", "Overtime minutes", "Regular pay", "Overtime pay", "Total pay", "Timezone"];
            return [
                header,
                ...rows.map((log) => [
                    log.id,
                    log.userID,
                    log.profileSnapshot?.name || "",
                    log.profileSnapshot?.department || "",
                    log.profileSnapshot?.position || "",
                    log.profileSnapshot?.employmentType || "",
                    log.profileSnapshot?.rateUnit || "",
                    log.profileSnapshot?.rate ?? "",
                    log.inAt,
                    log.outAt || "",
                    log.totalMinutes || "",
                    log.regularMinutes || "",
                    log.overtimeMinutes || "",
                    log.pay?.regularPay ?? "",
                    log.pay?.overtimePay ?? "",
                    log.pay?.totalPay ?? "",
                    log.timezone,
                ]),
            ].map((row) => row.map(escape).join(",")).join("\r\n");
        },
        listUsers() {
            return state.logs;
        },
        formatMinutes,
        overtimeMultiplier,
    };

    save(state);
    return store;
}

function calculatePay(log, profile) {
    const rate = Number(profile?.rate || 0);
    const unit = profile?.rateUnit;
    const regularHours = log.regularMinutes / 60;
    const overtimeHours = log.overtimeMinutes / 60;
    const regularDayFraction = log.regularMinutes / configuredMinutes();
    const overtimeDayFraction = log.overtimeMinutes / configuredMinutes();
    let regularPay = 0;
    let overtimePay = 0;
    if (unit === "hour") {
        regularPay = regularHours * rate;
        overtimePay = overtimeHours * rate * overtimeMultiplier();
    } else if (unit === "day") {
        regularPay = regularDayFraction * rate;
        overtimePay = overtimeDayFraction * rate * overtimeMultiplier();
    } else if (unit === "fixed") {
        regularPay = rate;
    }
    return {
        regularPay: Number(regularPay.toFixed(2)),
        overtimePay: Number(overtimePay.toFixed(2)),
        totalPay: Number((regularPay + overtimePay).toFixed(2)),
        currency: global.config.WORK_CURRENCY || "",
    };
}
