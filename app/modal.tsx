import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BebanKu</Text>
      <View style={styles.separator} />
      <Text style={styles.text}>Aplikasi Pencatat Kegiatan Gym</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    backgroundColor: Colors.borderLight,
  },
  text: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
