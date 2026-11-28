# Magnetism Lab

Simulador interactivo 3D de magnetostática y dinámica de cargas en campos electromagnéticos. Todos los cálculos, parámetros y mediciones operan en el **Sistema Internacional de Unidades (SI)** y se contrastan en vivo frente a soluciones analíticas con referencias bibliográficas por ecuación.

## Módulos de simulación

1. **Campo magnético** (`js/modules/tema1-campo-magnetico.js`)
   - Definición operacional $\vec{F}_B = q(\vec{v}\times\vec{B})$, paralelogramo del producto cruz y regla de la mano derecha para cargas positivas y negativas.
   - Imán permanente de barra (polos N–S) con brújula 3D arrastrable directamente en el plano $XY$.
2. **Fuentes de campo magnético** (`js/modules/tema2-fuentes-campo-magnetico.js`)
   - Integración discreta de Biot-Savart para hilo recto largo, espira circular, bobinas de Helmholtz, solenoide, elemento diferencial $I\,d\vec{l}$ y carga puntual en movimiento $q\vec{v}$, con sonda 3D arrastrable, error relativo frente a fórmulas analíticas y perfil 2D espacial.
3. **Fuerza entre elementos de corriente** (`js/modules/tema3-fuerza-entre-corrientes.js`)
   - Interacción entre conductores rectos paralelos ($F/L = \mu_0 I_1 I_2 / 2\pi d$), atracción y repulsión según el sentido relativo y fuerza sobre un segmento diferencial $\Delta l$.
4. **Momento de torsión sobre un lazo** (`js/modules/tema4-momento-torsion-lazo.js`)
   - Espira rectangular o circular en campo $\vec{B}$ uniforme ($\vec{\tau} = \vec{\mu}\times\vec{B}$), par de fuerzas laterales, rotación amortiguada hacia el equilibrio y gráfica 2D en vivo de energía potencial $U(\theta)$ y torque $|\tau(\theta)|$.
5. **Movimiento de una partícula cargada** (`js/modules/tema5-movimiento-particula.js`)
   - Integrador simpléctico de **Boris** para ciclotrón, hélice magnética, selector de velocidades ($v = E/B$), espectrómetro de masas y deriva $\vec{E}\times\vec{B}$, con registro temporal de energía cinética $E_k(t)$.
6. **Flujo magnético** (`js/modules/tema6-flujo-magnetico.js`)
   - Superficie plana orientable (disco o cuadrado), área proyectada $A\cos\theta$, conteo de líneas interceptadas, integración numérica sobre malla $64\times 64$ y curva cosenoidal $\Phi_B(\theta)$ en vivo.
7. **Ley de Gauss del magnetismo** (`js/modules/tema7-ley-gauss-magnetismo.js`)
   - Superficie gaussiana cerrada (esfera o caja) arrastrable en el plano $XY$ alrededor de un imán o una espira, mostrando el balance numérico $\Phi_{\text{sal}} + \Phi_{\text{ent}} \approx 0$ ($\nabla\cdot\vec{B} = 0$).

## Características técnicas

- **Entorno 3D científico:** ejes personalizados con marcas de escala y etiquetas (`+X`, `+Y`, `+Z`), cuadrículas con divisiones principales/secundarias, vectores sólidos con etiquetas 3D, iluminación de 3 puntos y vistas ortogonales rápidas (`3D`, `XY`, `XZ`, `YZ`).
- **Instrumentación y gráficas 2D:** entradas numéricas editables sincronizadas con deslizadores, lecturas SI jerarquizadas con números tabulares (`IBM Plex Mono`) y perfiles 2D en Canvas HiDPI.
- **Manipulación directa y exportación:** arrastre 3D por raycasting de sondas, brújula y superficie gaussiana; exportación de capturas **PNG** del visor 3D y archivos **CSV** con parámetros, mediciones SI y curvas muestreadas.
- **Trazabilidad bibliográfica:** cada ecuación en la pestaña *Análisis y teoría* enlaza directamente a su referencia bibliográfica en formato APA (Young & Freedman, Griffiths, Serway & Jewett, Boris 1970, Birdsall & Langdon, BIPM/CODATA).

## Estructura del proyecto

```text
ElectroProject/
├── index.html                              # Shell principal, barra superior, visor 3D y panel técnico
├── assets/
│   └── logo.svg                            # Isotipo geométrico de líneas dipolares
├── css/
│   └── styles.css                          # Sistema de diseño claro/oscuro, tipografía y layout responsivo
└── js/
    ├── core/
    │   ├── constants.js                    # Constantes físicas SI y registro de módulos
    │   ├── references.js                   # Catálogo bibliográfico APA y citas por ecuación
    │   ├── scene.js                        # Escena Three.js, iluminación, paleta adaptable y limpieza GPU
    │   ├── viz3d.js                        # Primitivas 3D científicas (ejes, cuadrícula, vectores y etiquetas)
    │   ├── plot2d.js                       # Motor de gráficas 2D científicas en Canvas HiDPI
    │   ├── drag3d.js                       # Manipulación directa 3D mediante raycasting
    │   ├── export.js                       # Exportación de capturas PNG y datos CSV
    │   ├── ui.js                           # Entradas numéricas, variantes, mediciones SI y KaTeX
    │   ├── explainer.js                    # Desarrollo analítico contextual por tema
    │   └── inspector.js                    # Leyenda contextual e inspección 3D de vectores
    ├── modules/
    │   ├── tema1-campo-magnetico.js
    │   ├── tema2-fuentes-campo-magnetico.js
    │   ├── tema3-fuerza-entre-corrientes.js
    │   ├── tema4-momento-torsion-lazo.js
    │   ├── tema5-movimiento-particula.js
    │   ├── tema6-flujo-magnetico.js
    │   └── tema7-ley-gauss-magnetismo.js
    └── main.js                             # Navegación, vistas ortogonales, atajos y bucle de animación
```

## Uso local

Basta abrir `index.html` desde un servidor estático local (por ejemplo `npx serve` o Live Server) o desplegar directamente en GitHub Pages. Atajos de teclado disponibles: `1`–`7` para cambiar de módulo, `Espacio` para iniciar/pausar, `R` para reiniciar y `Esc` para cerrar ventanas o inspecciones.
