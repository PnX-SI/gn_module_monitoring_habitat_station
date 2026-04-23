from geonature.utils.env import DB, db

class MonitoringHabitatStation(db.Model):
    """
    Module DB master parent abstract class.
    Debug is more easy.
    """

    __abstract__ = True

    def __repr__(self):
        return str(self.__class__) + ": " + str(self.__dict__)

    def __str__(self):
        return str(self.__class__) + ": " + str(self.__dict__)
