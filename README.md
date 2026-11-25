# Magnetism Lab — Proyecto Final

Simulador interactivo 3D en tiempo real desarrollado con **Three.js**, **KaTeX** y **JavaScript puro (Vanilla JS)**, sin dependencias de backend. Todos los cálculos físicos y lecturas numéricas utilizan el **Sistema Internacional de Unidades (SI)** y se validan en vivo contra soluciones analíticas.

## Los 7 Temas del Laboratorio

1. **Campo magnético** (`js/modules/tema1-campo-magnetico.js`)
   - Definición vectorial $\vec{F}_B = q(\vec{v}\times\vec{B})$, paralelogramo del producto cruz y regla de la mano derecha para cargas positivas y negativas.
   - Imán de barra (polos N–S) con brújula 3D que se alinea con $\vec{B}$ local.
2. **Fuentes de campo magnético** (`js/modules/tema2-fuentes-campo-magnetico.js`)
   - Ley de Biot-Savart: hilo recto largo, espira circular, bobinas de Helmholtz, solenoide, elemento diferencial $I\,d\vec{l}$ y carga puntual en movimiento $q\vec{v}$, con sonda 3D y error relativo frente a fórmulas analíticas.
3. **Fuerza magnética entre elementos de corriente** (`js/modules/tema3-fuerza-entre-corrientes.js`)
   - Dos conductores rectos paralelos ($F/L = \mu_0 I_1 I_2 / 2\pi d$), atracción y repulsión según el sentido de las corrientes y fuerza sobre un segmento diferencial $\Delta l$.
4. **Momento de torsión sobre un lazo de corriente** (`js/modules/tema4-momento-torsion-lazo.js`)
   - Espira rectangular o circular en campo $\vec{B}$ uniforme ($\vec{\tau} = \vec{\mu}\times\vec{B}$), momento dipolar $\vec{\mu} = N I A\,\hat{n}$, par de fuerzas y rotación amortiguada hacia el equilibrio.
5. **Movimiento de una partícula cargada en un campo** (`js/modules/tema5-movimiento-particula.js`)
   - Integrador simpléctico de **Boris**. Casos: ciclotrón, hélice magnética, selector de velocidades ($v = E/B$), espectrómetro de masas y deriva $\vec{E}\times\vec{B}$.
6. **Flujo magnético** (`js/modules/tema6-flujo-magnetico.js`)
   - Superficie plana orientable, $\Phi_B = B A \cos\theta$, área proyectada $A\cos\theta$ y conteo de líneas de campo que la atraviesan.
7. **Ley de Gauss del magnetismo** (`js/modules/tema7-ley-gauss-magnetismo.js`)
   - Superficie gaussiana cerrada (esfera o caja) sobre un imán o una espira, verificando $\oint_S \vec{B}\cdot d\vec{A} = 0$ ($\nabla\cdot\vec{B} = 0$).

## Estructura del Proyecto

```text
ElectroProject/
├── index.html                              # Interfaz principal y modal de los 7 temas
├── assets/
│   └── logo.svg                            # Logo del proyecto
├── css/
│   └── styles.css                          # Estilos, temas claro/oscuro y layout
└── js/
    ├── core/
    │   ├── constants.js                    # Constantes físicas SI y registro de módulos
    │   ├── scene.js                        # Escena Three.js, cámara e iluminación
    │   ├── ui.js                           # Sliders, variantes, lecturas y KaTeX
    │   ├── explainer.js                    # Explicación paso a paso (barra derecha)
    │   └── inspector.js                    # Código de colores 3D interactivo
    ├── modules/
    │   ├── tema1-campo-magnetico.js
    │   ├── tema2-fuentes-campo-magnetico.js
    │   ├── tema3-fuerza-entre-corrientes.js
    │   ├── tema4-momento-torsion-lazo.js
    │   ├── tema5-movimiento-particula.js
    │   ├── tema6-flujo-magnetico.js
    │   └── tema7-ley-gauss-magnetismo.js
    └── main.js                             # Navegación, cámara, FPS y bucle de animación
```
