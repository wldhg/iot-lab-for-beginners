#ifndef VEGEMITE_DICT_H
#define VEGEMITE_DICT_H

#define V_STATICDICT_CAPACITY 12
#define V_STATICDICT_KEY_SIZE 24

template <typename V>
class VegemiteDict {
 private:
  char _keys[V_STATICDICT_CAPACITY][V_STATICDICT_KEY_SIZE];
  V _values[V_STATICDICT_CAPACITY];

  int _getKeyPos(const char* dataID) {
    for (size_t i = 0; i < V_STATICDICT_CAPACITY; ++i) {
      if (strncmp(_keys[i], dataID, V_STATICDICT_KEY_SIZE) == 0) {
        return i;
      }
    }
    return -1;
  }

 public:
  VegemiteDict() : _keys{{}}, _values{} {}

  bool exists(const char* dataID) { return _getKeyPos(dataID) != -1; }

  void remove(const char* dataID) {
    int pos = _getKeyPos(dataID);
    if (pos != -1) {
      _keys[pos][0] = '\0';
      _values[pos] = V();
    }
  }

  char* getKey(int pos) { return _keys[pos]; }

  V& operator[](const char* dataID) {
    int keyPos = _getKeyPos(dataID);
    if (keyPos == -1) {
      keyPos = _getKeyPos("");
    }
    if (keyPos != -1) {
      strncpy(_keys[keyPos], dataID, V_STATICDICT_KEY_SIZE);
    }
    return _values[keyPos];
  }
};

#endif  // VEGEMITE_DICT_H
