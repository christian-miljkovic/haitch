import styles from './FieldError.module.css';

// Renders the validation message under a field. The slot is always present so
// a message appearing never shifts the layout (which would move whatever the
// user is mid-click on). Pair the `id` with the input's aria-describedby.
export default function FieldError({ id, message }: { id: string; message: string | null }) {
  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  );
}
