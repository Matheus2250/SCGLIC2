from .usuario import Usuario
from .pca import PCA
from .qualificacao import Qualificacao
from .licitacao import Licitacao
from .access_request import AccessRequest

# Import opcional: ActivityEvent pode nao existir em instalaees antigas/migrando
try:
    from .activity_event import ActivityEvent  # type: ignore
except Exception:
    ActivityEvent = None  # type: ignore

__all__ = [
    "Usuario",
    "PCA",
    "Qualificacao",
    "Licitacao",
    "AccessRequest",
]
if ActivityEvent is not None:
    __all__.append("ActivityEvent")
