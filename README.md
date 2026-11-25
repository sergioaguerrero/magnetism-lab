# Magnetism Lab — Electromagnetismo (Proyecto Final)

Simulador interactivo 3D en tiempo real desarrollado con **Three.js** y **JavaScript puro (Vanilla JS)**, sin dependencias de backend. Todos los cálculos físicos y lecturas numéricas utilizan el **Sistema Internacional de Unidades (SI)** y se validan en vivo contra soluciones analíticas.

## Cobertura de los 7 Temas del Laboratorio

1. **Campo magnético y Regla de la Mano Derecha** (`js/modules/mod1-lorentz.js`)
   - Triedro 3D sobre la partícula: velocidad $\vec{v}$ (índice), campo $\vec{B}$ (medio), producto cruz $\vec{v}\times\vec{B}$ (pulgar) y fuerza $\vec{F}_B = q(\vec{v}\times\vec{B})$.
2. **Movimiento de una partícula cargada en campos $\vec{E}$ y $\vec{B}$** (`js/modules/mod1-lorentz.js`)
   - Integrador simpléctico de **Boris** (conserva la energía cinética en $\vec{B}$ puro).
   - Presets interactivos: **Ciclotrón**, **Hélice magnética**, **Selector de velocidades ($v = E/B$)**, **Espectrómetro de masas ($\alpha$ vs. protón)** y **Deriva $\vec{E}\times\vec{B}$**.
3. **Fuentes de campo magnético — Ley de Biot-Savart** (`js/modules/mod2-biot-savart.js`)
   - Hilo recto largo, espira circular, bobinas de Helmholtz, solenoide, elemento diferencial $I\,d\vec{l}$ y carga puntual en movimiento $q\vec{v}$, con sonda 3D y error relativo frente a fórmulas analíticas.
4. **Fuerza magnética entre elementos de corriente** (`js/modules/mod3-fuerza-conductores.js`)
   - Dos conductores rectos paralelos ($F/L = \mu_0 I_1 I_2 / 2\pi d$), atracción y repulsión según el sentido de las corrientes, anillos de campo magnético y fuerza sobre un segmento diferencial $\Delta l$.
5. **Momento de torsión sobre un lazo de corriente** (`js/modules/mod4-torque-espira.js`)
   - Espira rectangular o circular en campo $\vec{B}$ uniforme ($\vec{\tau} = \vec{\mu}\times\vec{B}$), vector momento dipolar $\vec{\mu} = N I A\,\hat{n}$, par de fuerzas laterales $\vec{F}_1, \vec{F}_2$ y rotación amortiguada hacia el equilibrio estable ($\theta = 0^\circ$).
6. **Flujo magnético** (`js/modules/mod5-flujo-magnetico.js`)
   - Superficie plana orientable (disco o cuadrado), $\Phi_B = \vec{B}\cdot\vec{A} = B A \cos\theta$, proyección del área efectiva $A\cos\theta$, conteo de líneas de campo que atraviesan la superficie y modo de rotación continua $\omega$.
7. **Ley de Gauss del magnetismo** (`js/modules/mod6-gauss-magnetismo.js`)
   - Superficie gaussiana cerrada (esfera o caja) desplazable sobre un imán de barra (dipolo N–S) o una espira circular, verificando $\oint_S \vec{B}\cdot d\vec{A} = \Phi_{\text{saliente}} + \Phi_{\text{entrante}} = 0$ ($\nabla\cdot\vec{B} = 0$).

## Estructura del Proyecto

```text
ElectroProject/
├── index.html                        # Interfaz principal y modal de los 7 temas
├── css/
│   └── styles.css                    # Estilos, temas claro/oscuro y layout
└── js/
    ├── core/
    │   ├── constants.js              # Constantes físicas SI (μ₀, e, masas) y registro modular
    │   ├── scene.js                  # Escena Three.js, cámara, OrbitControls e iluminación
    │   └── ui.js                     # Generador dinámico de sliders, selectores y lecturas SI
    ├── modules/
    │   ├── mod1-lorentz.js           # Módulo 1: Carga en E y B, presets y regla mano derecha
    │   ├── mod2-biot-savart.js       # Módulo 2: Biot-Savart y fuentes adicionales (dl, q·v)
    │   ├── mod3-fuerza-conductores.js# Módulo 3: Fuerza entre elementos de corriente
    │   ├── mod4-torque-espira.js     # Módulo 4: Torque sobre un lazo de corriente
    │   ├── mod5-flujo-magnetico.js   # Módulo 5: Flujo magnético en superficie orientable
    │   └── mod6-gauss-magnetismo.js  # Módulo 6: Ley de Gauss del magnetismo (∇·B = 0)
    └── main.js                       # Navegación de módulos, cámara, FPS y bucle WebGL
```
