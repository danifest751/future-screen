type Props = {
  message?: string;
};

const AdminFieldError = ({ message }: Props) => {
  if (!message) return null;

  return (
    <div className="mt-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-300">
      {message}
    </div>
  );
};

export default AdminFieldError;
