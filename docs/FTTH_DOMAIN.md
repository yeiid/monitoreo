# FTTH Domain Guide - Glosario y Conceptos

## ¿Qué es FTTH?

**FTTH** (Fiber To The Home) es una tecnología de acceso de banda ancha que utiliza fibra óptica para conectar directamente las viviendas o negocios con la red del proveedor de servicios de internet (ISP).

---

## Topología de Red FTTH

```
                    CENTRAL                    CAMPO
                ┌─────────────┐
                │     OLT     │
                │  (Optical   │
                │   Line      │
                │   Terminal) │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │     ODF     │
                │ (Optical    │
                │  Distribu-  │
                │  tion Frame)│
                └──────┬──────┘
                       │
            ═══════════╪═══════════  Cable Troncal
                       │
                ┌──────▼──────┐
                │   MUFLA     │
                │  (Empalme)  │
                └──────┬──────┘
                       │
            ┌──────────┼──────────┐
            │          │          │
     ═══════╪═══ ══════╪═══ ══════╪══  Cable Distribución
            │          │          │
     ┌──────▼──┐ ┌─────▼───┐ ┌───▼────┐
     │  CAJA   │ │  CAJA   │ │  CAJA  │
     │  NAP    │ │  NAP    │ │  NAP   │
     └────┬────┘ └────┬────┘ └───┬────┘
          │           │          │
     ═════╪═══   ═════╪═══  ═════╪═══  Cable Acometida
          │           │          │
     ┌────▼────┐ ┌────▼────┐ ┌───▼────┐
     │ CLIENTE │ │ CLIENTE │ │CLIENTE │
     │   ONU   │ │   ONU   │ │  ONU   │
     └─────────┘ └─────────┘ └────────┘
```

---

## Glosario de Términos

### Equipos

| Término | Siglas | Descripción |
|---------|--------|-------------|
| **Optical Line Terminal** | OLT | Equipo en la central que transmite/receive señales ópticas |
| **Optical Distribution Frame** | ODF | Panel de distribución de fibras en la central |
| **Optical Network Unit** | ONU | Terminal en el domicilio del cliente |
| **Optical Network Terminal** | ONT | Sinónimo de ONU |
| **Multiplexor de Empalmes** | MUFLA | Caja donde se realizan empalmes de fibra |
| **Network Access Point** | NAP | Punto de附着 en campo donde se conectan los clientes |

### Cables

| Tipo | Descripción | Capacidad típica |
|------|-------------|------------------|
| **Patchcord** | Cable corto OLT ↔ ODF | 1-12 fibras |
| **Cable Troncal** | Cable principal ODF ↔ Mufla | 12-288 fibras |
| **Cable de Distribución** | Cable secundario Mufla ↔ NAP | 6-96 fibras |
| **Acometida (Drop)** | Cable al cliente final | 1-2 fibras |

### Componentes Ópticos

| Componente | Función | Pérdida típica |
|------------|---------|----------------|
| **Splitter** | Divide la señal óptica | 7.2-17.1 dB |
| **Empalme (Splice)** | Conecta dos fibras | 0.1 dB |
| **Conector** | Conexión desmontable | 0.5 dB |

### Splitters

| Tipo | Ratio | Pérdida | Uso |
|------|-------|---------|-----|
| 1x4 | 1:4 | 7.2 dB | Redes pequeñas |
| 1x8 | 1:8 | 10.5 dB | Redes medianas |
| 1x16 | 1:16 | 13.8 dB | Redes grandes |
| 1x32 | 1:32 | 17.1 dB | FTTH masivo |

---

## Colores TIA-598

Estándar para identificación de fibras en cables de fibra óptica:

| Número | Color |
|--------|-------|
| 1 | Azul |
| 2 | Naranja |
| 3 | Verde |
| 4 | Marrón |
| 5 | Gris |
| 6 | Blanco |
| 7 | Rojo |
| 8 | Negro |
| 9 | Amarillo |
| 10 | Violeta |
| 11 | Rosa |
| 12 | Aqua |

Los colores se repiten en buffers adicionales (ej: fibra 13 = azul del buffer 2).

---

## Presupuesto Óptico

El presupuesto óptico es la **pérdida total de potencia**允许en una enlace de fibra óptica desde el emisor (OLT) hasta el receptor (ONU del cliente).

### Fórmula

```
P_recibido = P_OLT - (Pérdida_fibra + Pérdida_conectores + Pérdida_empalmes + Pérdida_splitters)
```

### Componentes de Pérdida

| Componente | Fórmula | Ejemplo |
|------------|---------|---------|
| **Fibra** | Distancia_km × 0.25 dB/km | 2 km = 0.5 dB |
| **Conectores** | Nro_conectores × 0.5 dB | 2 conectores = 1.0 dB |
| **Empalmes** | Nro_empalmes × 0.1 dB | 4 empalmes = 0.4 dB |
| **Splitters** | Según ratio | 1x8 = 10.5 dB |

### Ejemplo de Cálculo

```
Ruta: OLT → ODF → MUFLA → NAP → CLIENTE

OLT ──── 500m ────► ODF ──── 1km ────► MUFLA ──── 800m ────► NAP ──── 200m ────► CLIENTE
         Patchcord        Troncal          Distribución        Acometida

Pérdida fibra: (0.5 + 1.0 + 0.8 + 0.2) km × 0.25 dB/km = 0.625 dB
Pérdida conectores: 4 × 0.5 dB = 2.0 dB
Pérdida empalmes: 3 × 0.1 dB = 0.3 dB
Pérdida splitter: 10.5 dB (1x8 en NAP)

Total: 13.425 dB
Potencia recibida: 5.0 - 13.425 = -8.425 dBm (excelente)
```

### Niveles de Potencia

| Nivel | Rango | Significado |
|-------|-------|-------------|
| Excelente | > -24 dBm | Señal fuerte, margen amplio |
| Advertencia | -24 a -27 dBm | Señal aceptable, monitorear |
| Crítico | < -27 dBm | Señal débil, puede haber cortes |

---

## Siglas y Abreviaturas

| Sigla | Significado |
|-------|-------------|
| FTTH | Fiber To The Home (Fibra hasta el hogar) |
| FTTB | Fiber To The Building (Fibra hasta el edificio) |
| FTTC | Fiber To The Curb (Fibra hasta la acera) |
| PON | Passive Optical Network (Red óptica pasiva) |
| GPON | Gigabit PON (PON de gigabit) |
| EPON | Ethernet PON |
| OLT | Optical Line Terminal |
| ONU | Optical Network Unit |
| ONT | Optical Network Terminal |
| ODF | Optical Distribution Frame |
| NAP | Network Access Point |
| SPL | Splitter (Divisor óptico) |
| dB | Decibelio (unidad de potencia) |
| dBm | Decibelio-milivatio (potencia absoluta) |
| λ | Lambda (longitud de onda) |
| NM | Nanómetro |

---

## Longitudes de Onda GPON

| Dirección | Longitud de onda | Uso |
|-----------|------------------|-----|
| Downstream | 1490 nm | Datos de central a cliente |
| Upstream | 1310 nm | Datos de cliente a central |
| Video | 1550 nm | Servicio de video overlay |

---

## Referencias

- **ITU-T G.984** - Estándar GPON
- **TIA-598** - Colores de fibra óptica
- **IEC 61300** - Conectores y empalmes
- **ITU-T G.652** - Fibra óptica monomodo
