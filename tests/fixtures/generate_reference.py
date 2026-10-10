"""Optional independent fixture generator; requires SciPy, not used by npm test.
QUADPACK numerical quadrature, not the application's Simpson/series algorithm.
SI constants are the exact post-2019 definitions. Units: wavelength micrometres,
exitance per square centimetre. Run from any working directory.
"""
from pathlib import Path
import json
import math
from scipy.integrate import quad

def integrand(x, order):
    return 0.0 if x == 0 or x > 745 else x ** order * math.exp(-x) / -math.expm1(-x)
result = {'method': 'SciPy QUADPACK independent quadrature', 'integrals': []}
for order in (2, 3):
    total = quad(lambda x: integrand(x, order), 0, math.inf, epsabs=1e-12, epsrel=1e-12)[0]
    for u in (1e-06, 0.0001, 0.01, 0.1, 0.5, 0.999, 1, 2, 3.920690394872886, 4.965114231744276, 10, 20, 50):
        lower = quad(lambda x: integrand(x, order), 0, u, epsabs=1e-30, epsrel=1e-12)[0] / total
        tail = quad(lambda x: integrand(x, order), u, math.inf, epsabs=1e-30, epsrel=1e-12)[0] / total
        result['integrals'].append({'u': u, 'order': order, 'lower': lower, 'tail': tail})
Path(__file__).with_name('planck.json').write_text(json.dumps(result, indent=2) + '\n', encoding='utf-8', newline='\n')
