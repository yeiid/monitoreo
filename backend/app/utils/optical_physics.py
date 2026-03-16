# ─────────────────────────────────────────────────────────────
# Optical Signal Attenuation Constants — ITU-T G.984 / TIA-568
# ─────────────────────────────────────────────────────────────

# Splitter insertion loss (dB) — theoretical + insertion overhead
SPLITTER_LOSS = {
    "1x4":  7.2,    # ~7.0 theoretical + 0.2 insertion
    "1x8":  10.5,   # ~10.2 theoretical + 0.3 insertion
    "1x16": 13.8,   # ~13.5 theoretical + 0.3 insertion
    "1x32": 17.1,   # ~16.8 theoretical + 0.3 insertion
}

# Per-splice/fusion loss (dB) — average IEC 61300
SPLICE_LOSS = 0.1

# Fiber attenuation per km at 1490 nm (GPON downstream)
FIBER_LOSS_PER_KM = 0.25

# Mechanical connector loss (SC/APC mated pair)
CONNECTOR_LOSS = 0.5

# Typical OLT launch power (dBm)
OLT_LAUNCH_POWER = 5.0

# GPON receiver sensitivity thresholds
POWER_EXCELLENT = -24.0   # > -24 dBm → Green
POWER_WARNING   = -27.0   # -24 to -27 dBm → Yellow
# < -27 dBm → Red / Critical


def calculate_output_power(input_power: float, splitter_type: str = None) -> float:
    """
    Calculates the output power after a splice/node.
    Formula: P_out = P_in - Loss_splitter - Loss_splice
    """
    loss = SPLICE_LOSS
    if splitter_type and splitter_type in SPLITTER_LOSS:
        loss += SPLITTER_LOSS[splitter_type]
    return round(input_power - loss, 2)


def calculate_route_loss(length_meters: float) -> float:
    """
    Fiber attenuation based on cable length.
    Formula: Loss = (meters / 1000) × 0.25 dB/km
    """
    return round((length_meters / 1000.0) * FIBER_LOSS_PER_KM, 3)


def power_level(dbm: float) -> str:
    """Returns traffic-light level for a given received power."""
    if dbm > POWER_EXCELLENT:
        return "excellent"
    elif dbm > POWER_WARNING:
        return "warning"
    else:
        return "critical"
