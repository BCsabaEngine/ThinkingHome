const PresenceObjectStatusTable = db.defineTable('PresenceObjectStatus', {
  columns: {
    Id: db.ColTypes.int(11).notNull().primaryKey().autoIncrement(),
    DateTime: db.ColTypes.datetime().notNull().defaultCurrentTimestamp(),
    PresenceObject: db.ColTypes.int(11).notNull().index(),
    Status: db.ColTypes.tinyint(1).notNull(),
    Reason: db.ColTypes.varchar(100),
  },
  keys: [
    db.KeyTypes.foreignKey('PresenceObject').references('PresenceObject', 'Id').cascade(),
    db.KeyTypes.index('DateTime', 'PresenceObject', 'Status'),
  ],
  triggers: {
    PresenceObjectStatus_UpdateSeries: `
      CREATE TRIGGER PresenceObjectStatus_UpdateSeries
      AFTER INSERT ON PresenceObjectStatus
      FOR EACH ROW
      BEGIN
        UPDATE PresenceObjectStatusSeries poss
        SET poss.DateTimeEnd = NOW()
        WHERE poss.PresenceObject = NEW.PresenceObject AND
              poss.DateTimeEnd IS NULL AND
              poss.Status != NEW.Status;
        
        IF NOT EXISTS(SELECT 1
                      FROM PresenceObjectStatusSeries poss
                      WHERE poss.PresenceObject = NEW.PresenceObject AND
                      poss.DateTimeEnd IS NULL AND
                      poss.Status = NEW.Status) THEN
          INSERT INTO PresenceObjectStatusSeries
            (PresenceObject, Status)
        VALUES
            (NEW.PresenceObject, NEW.Status);
        END IF;
      END;`
  },
});

const PresenceObjectStatus = {

  GetAllByDeviceId(presenceobjectid) {
    return db.pquery("SELECT ds.DateTime, ds.Status FROM PresenceObjectStatus ds WHERE ds.PresenceObject = ?  AND ds.DateTime > NOW() - INTERVAL 7 DAY", [presenceobjectid]);
  },

  Insert(presenceobjectid, status, reason) {
    return PresenceObjectStatusTable.insert({ PresenceObject: presenceobjectid, Status: status ? 1 : 0, Reason: reason });
  },

};

module.exports = PresenceObjectStatus;