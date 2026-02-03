import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  User,
  LogOut,
  Users,
  GraduationCap,
  Plus,
  Pencil,
  Trash2,
  ArrowRightLeft,
  Shield,
  Search,
  Loader2,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface UserProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<UserProfile[]>([]);
  const [mentees, setMentees] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogRole, setDialogRole] = useState<"mentor" | "mentee">("mentee");

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [newRole, setNewRole] = useState<"mentor" | "mentee">("mentee");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        navigate("/auth?role=mentee");
        return;
      }
      
      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        navigate("/auth?role=mentee");
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        return;
      }
      
      setUser(session.user);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth?role=mentee");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();
      
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        navigate("/auth?role=mentee");
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        return;
      }
      
      setUser(session.user);
      fetchUsers();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url, role")
        .neq("role", "admin");

      if (error) throw error;

      const mentorList = profiles?.filter(p => p.role === "mentor") || [];
      const menteeList = profiles?.filter(p => p.role === "mentee") || [];

      setMentors(mentorList);
      setMentees(menteeList);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleOpenAddDialog = (role: "mentor" | "mentee") => {
    setDialogRole(role);
    setFormEmail("");
    setFormPassword("");
    setFormName("");
    setAddDialogOpen(true);
  };

  const handleOpenEditDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setFormName(user.full_name || "");
    setFormEmail(user.email || "");
    setEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleOpenRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role === "mentor" ? "mentee" : "mentor");
    setRoleDialogOpen(true);
  };

  const handleAddUser = async () => {
    if (!formEmail || !formPassword) {
      toast({
        title: "Missing Information",
        description: "Please fill in email and password",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      // Create user via Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formEmail,
        password: formPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            role: dialogRole,
            full_name: formName,
          }
        }
      });

      if (error) throw error;

      toast({
        title: "User Created",
        description: `${dialogRole.charAt(0).toUpperCase() + dialogRole.slice(1)} account created successfully.`,
      });

      setAddDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          full_name: formName,
          email: formEmail,
        })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "Profile updated successfully.",
      });

      setEditDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // Delete from profiles (cascade will handle related tables)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Delete from user_roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUser.user_id);

      // Delete role-specific profile
      if (selectedUser.role === "mentor") {
        await supabase
          .from("mentor_profiles")
          .delete()
          .eq("user_id", selectedUser.user_id);
      } else {
        await supabase
          .from("mentee_profiles")
          .delete()
          .eq("user_id", selectedUser.user_id);
      }

      toast({
        title: "User Deleted",
        description: "User account has been removed.",
      });

      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      // Update profile role
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("user_id", selectedUser.user_id);

      if (profileError) throw profileError;

      // Update user_roles
      const { error: roleError } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", selectedUser.user_id);

      if (roleError) throw roleError;

      // If changing to mentor, create mentor profile
      if (newRole === "mentor") {
        await supabase
          .from("mentee_profiles")
          .delete()
          .eq("user_id", selectedUser.user_id);
        
        await supabase
          .from("mentor_profiles")
          .insert({ user_id: selectedUser.user_id })
          .select();
      } else {
        // If changing to mentee, create mentee profile
        await supabase
          .from("mentor_profiles")
          .delete()
          .eq("user_id", selectedUser.user_id);
        
        await supabase
          .from("mentee_profiles")
          .insert({ user_id: selectedUser.user_id })
          .select();
      }

      toast({
        title: "Role Changed",
        description: `User is now a ${newRole}.`,
      });

      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to change role";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMentors = mentors.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentees = mentees.filter(m => 
    m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex flex-col items-center">
              <h1 className="text-xl md:text-2xl font-semibold text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                IILM UNIVERSITY
              </h1>
              <span className="text-xs md:text-sm text-primary font-medium italic">Admin Portal</span>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden md:flex items-center gap-1 bg-primary/10 text-primary border-primary/30">
                <Shield className="w-3 h-3" />
                Admin
              </Badge>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-foreground mb-2">
              Admin Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage mentors and mentees across the platform.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{mentors.length}</p>
                  <p className="text-xs text-muted-foreground">Mentors</p>
                </div>
              </div>
            </Card>
            <Card className="stat-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-foreground">{mentees.length}</p>
                  <p className="text-xs text-muted-foreground">Mentees</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="mentors" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="mentors" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Mentors ({filteredMentors.length})
              </TabsTrigger>
              <TabsTrigger value="mentees" className="gap-2">
                <Users className="w-4 h-4" />
                Mentees ({filteredMentees.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mentors">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Mentors</CardTitle>
                    <CardDescription>Manage mentor accounts</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenAddDialog("mentor")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Mentor
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMentors.map((mentor) => (
                        <TableRow key={mentor.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={mentor.avatar_url || ""} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{mentor.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{mentor.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(mentor)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenRoleDialog(mentor)}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleOpenDeleteDialog(mentor)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMentors.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No mentors found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mentees">
              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Mentees</CardTitle>
                    <CardDescription>Manage mentee accounts</CardDescription>
                  </div>
                  <Button onClick={() => handleOpenAddDialog("mentee")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Mentee
                  </Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMentees.map((mentee) => (
                        <TableRow key={mentee.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={mentee.avatar_url || ""} />
                                <AvatarFallback className="bg-success/10 text-success text-xs">
                                  <User className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{mentee.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{mentee.email}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(mentee)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenRoleDialog(mentee)}
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleOpenDeleteDialog(mentee)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMentees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No mentees found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Add New {dialogRole.charAt(0).toUpperCase() + dialogRole.slice(1)}</DialogTitle>
            <DialogDescription>
              Create a new {dialogRole} account with email and password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@iilm.edu"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Edit User</DialogTitle>
            <DialogDescription>
              Update user profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="John Doe"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@iilm.edu"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name || selectedUser?.email}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Change User Role</DialogTitle>
            <DialogDescription>
              Change {selectedUser?.full_name || selectedUser?.email}'s role from {selectedUser?.role} to {newRole}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as "mentor" | "mentee")}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="mentee">Mentee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeRole} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
